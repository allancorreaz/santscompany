function getRecaptchaSiteKey(form) {
  return (
    form.dataset.recaptchaSitekey ||
    window.SANTS_CONFIG?.recaptchaSiteKey ||
    ""
  );
}

function isLocalEnvironment() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

async function waitForRecaptcha() {
  if (typeof window.grecaptcha !== "undefined" && typeof window.grecaptcha.ready === "function") {
    return;
  }

  await new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (typeof window.grecaptcha !== "undefined" && typeof window.grecaptcha.ready === "function") {
        window.clearInterval(intervalId);
        resolve();
        return;
      }

      if (Date.now() - startedAt > 10000) {
        window.clearInterval(intervalId);
        reject(new Error("reCAPTCHA indisponivel"));
      }
    }, 100);
  });
}

async function getCaptchaResponse(form) {
  if (isLocalEnvironment()) return "local-dev-bypass";

  const sitekey = getRecaptchaSiteKey(form);
  if (!sitekey) return "";

  await waitForRecaptcha();

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(sitekey, { action: "contact_form_submit" })
        .then(resolve)
        .catch(reject);
    });
  });
}

async function parseContactResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: "Erro inesperado no servidor.",
      error: text
    };
  }
}

function resolveContactEndpoint() {
  const pathname = window.location.pathname.replace(/\\/g, "/");
  const isNestedPage = ["/pages/", "/blog/"].some((segment) => pathname.includes(segment));
  return isNestedPage ? "../send.php" : "./send.php";
}

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .replace(/(^|\s+)([^\s])/g, (match, spacing, char) => `${spacing}${char.toUpperCase()}`);
}

function formatPhoneNumber(phone) {
  const numbers = phone.replace(/\D/g, "");

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function formatMessage(msg) {
  if (!msg) return msg;

  let formatted = msg.trimStart();
  if (!formatted) return "";

  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  formatted = formatted.replace(/([.!?])(\s+)([a-zà-ÿ])/g, (match, punctuation, spacing, char) => `${punctuation}${spacing}${char.toUpperCase()}`);

  return formatted;
}

function formatFormData(formData) {
  const nameInput = formData.get("name");
  if (nameInput) {
    formData.set("name", capitalizeWords(nameInput));
  }

  const phoneCountry = formData.get("phoneCountry") || "+55";
  const phone = formData.get("phone");
  if (phone) {
    const formatted = formatPhoneNumber(phone);
    formData.set("phone", `${phoneCountry} ${formatted}`);
  }

  const messageInput = formData.get("message");
  if (messageInput) {
    const formattedMessage = formatMessage(messageInput).trimEnd();
    formData.set("message", /[.!?]$/.test(formattedMessage) ? formattedMessage : `${formattedMessage}.`);
  }

  return formData;
}

function initContactForms() {
  const phoneInput = document.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener("input", (event) => {
      event.target.value = formatPhoneNumber(event.target.value);
    });
  }

  const nameInput = document.querySelector('input[name="name"]');
  if (nameInput) {
    nameInput.addEventListener("input", (event) => {
      event.target.value = capitalizeWords(event.target.value);
    });
  }

  const messageInput = document.querySelector('textarea[name="message"]');
  if (messageInput) {
    messageInput.addEventListener("input", (event) => {
      const { selectionStart, selectionEnd } = event.target;
      const formattedMessage = formatMessage(event.target.value);

      if (formattedMessage !== event.target.value) {
        event.target.value = formattedMessage;
        if (selectionStart !== null && selectionEnd !== null) {
          event.target.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    });

    messageInput.addEventListener("blur", (event) => {
      const formattedMessage = formatMessage(event.target.value).trimEnd();
      event.target.value = formattedMessage
        ? (/[.!?]$/.test(formattedMessage) ? formattedMessage : `${formattedMessage}.`)
        : "";
    });
  }

  document.querySelectorAll(".contact-form").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type=submit]");
      const originalText = button.innerHTML;

      button.innerHTML = "Enviando...";
      button.disabled = true;

      try {
        const captchaResponse = await getCaptchaResponse(form);

        if (!captchaResponse) {
          button.innerHTML = "Falha no reCAPTCHA";
          button.style.backgroundColor = "#b45309";
          return;
        }

        let formData = new FormData(form);
        formData = formatFormData(formData);
        formData.set("g-recaptcha-response", captchaResponse);

        const response = await fetch(resolveContactEndpoint(), {
          method: "POST",
          body: formData,
        });

        const result = await parseContactResponse(response);

        if (!response.ok || !result.success) {
          button.innerHTML = result.message || "Erro ao enviar";
          button.style.backgroundColor = "#dc2626";
        } else {
          button.innerHTML = "Enviado com sucesso!";
          button.style.backgroundColor = "#16a34a";
          form.reset();
        }
      } catch {
        button.innerHTML = "Erro de conexão";
        button.style.backgroundColor = "#b45309";
      }

      window.setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = "";
        button.disabled = false;
      }, 4000);
    });
  });
}

function initCustomSelects(root = document) {
  root.querySelectorAll(".custom-select-wrapper").forEach((wrapper) => {
    if (wrapper.dataset.initialized === "true") return;
    wrapper.dataset.initialized = "true";

    const nativeSelect = wrapper.querySelector("select");
    if (!nativeSelect) return;

    wrapper.querySelectorAll(".custom-select, .custom-options").forEach((element) => element.remove());

    const customSelect = document.createElement("div");
    customSelect.className = "custom-select";
    customSelect.tabIndex = 0;
    wrapper.appendChild(customSelect);

    const optionsList = document.createElement("div");
    optionsList.className = "custom-options";
    wrapper.appendChild(optionsList);

    Array.from(nativeSelect.options).forEach((opt, idx) => {
      const optDiv = document.createElement("div");
      optDiv.className = "option";
      optDiv.textContent = opt.textContent;
      optDiv.dataset.index = idx;
      optDiv.dataset.value = opt.value;
      optionsList.appendChild(optDiv);
    });

    function updateDisplay() {
      const selectedOptions = Array.from(nativeSelect.selectedOptions);
      customSelect.innerHTML = "";

      if (selectedOptions.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        placeholder.textContent = "Selecione o seu serviço";
        customSelect.appendChild(placeholder);
        customSelect.appendChild(document.createElement("span")).className = "arrow";
        customSelect.querySelector(".arrow").textContent = "▼";
      } else {
        const tagContainer = document.createElement("div");
        tagContainer.style.display = "flex";
        tagContainer.style.flexWrap = "wrap";
        tagContainer.style.gap = "6px";
        tagContainer.style.flex = "1";

        selectedOptions.forEach((opt) => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.style.display = "inline-flex";
          tag.style.alignItems = "center";
          tag.style.gap = "4px";
          tag.style.background = "#e0e7ff";
          tag.style.color = "#3730a3";
          tag.style.padding = "4px 8px";
          tag.style.borderRadius = "6px";
          tag.style.fontSize = "0.85rem";

          const text = document.createElement("span");
          text.textContent = opt.textContent;
          tag.appendChild(text);

          const removeBtn = document.createElement("span");
          removeBtn.className = "remove-tag";
          removeBtn.textContent = "×";
          removeBtn.style.cursor = "pointer";
          removeBtn.style.fontWeight = "bold";
          removeBtn.style.color = "#3730a3";
          removeBtn.style.fontSize = "1.2rem";
          removeBtn.style.lineHeight = "1";
          removeBtn.style.display = "flex";
          removeBtn.style.alignItems = "center";
          removeBtn.style.justifyContent = "center";

          removeBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            opt.selected = false;
            updateDisplay();
            updateOptionsUI();
          });

          tag.appendChild(removeBtn);
          tagContainer.appendChild(tag);
        });

        customSelect.appendChild(tagContainer);
        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.textContent = "▼";
        arrow.style.marginLeft = "auto";
        customSelect.appendChild(arrow);
      }

      const form = wrapper.closest("form");
      if (form) {
        const otherContainer = form.querySelector("#otherServiceContainer");
        if (otherContainer) {
          const hasOutro = selectedOptions.some((option) => option.value === "Outro");
          otherContainer.style.display = hasOutro ? "block" : "none";
        }
      }
    }

    function updateOptionsUI() {
      Array.from(nativeSelect.options).forEach((opt, idx) => {
        const optDiv = optionsList.querySelector(`[data-index="${idx}"]`);
        if (!optDiv) return;

        if (opt.selected) {
          optDiv.classList.add("selected");
        } else {
          optDiv.classList.remove("selected");
        }
      });
    }

    customSelect.addEventListener("click", (event) => {
      event.stopPropagation();
      customSelect.classList.toggle("open");
    });

    wrapper.addEventListener("mouseenter", () => {
      customSelect.classList.add("open");
    });

    wrapper.addEventListener("mouseleave", () => {
      customSelect.classList.remove("open");
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        customSelect.classList.remove("open");
      }
    });

    optionsList.addEventListener("click", (event) => {
      if (!event.target.classList.contains("option")) return;

      const index = parseInt(event.target.dataset.index, 10);
      const option = nativeSelect.options[index];
      if (option) {
        option.selected = !option.selected;
        updateDisplay();
        updateOptionsUI();
        customSelect.classList.remove("open");
      }
    });

    nativeSelect.addEventListener("change", () => {
      updateDisplay();
      updateOptionsUI();
    });

    updateDisplay();
    updateOptionsUI();
  });
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        if (node.matches?.(".custom-select-wrapper") || node.querySelector?.(".custom-select-wrapper")) {
          initCustomSelects(node);
        }
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function initFormsBundle() {
  initCustomSelects();
  initContactForms();
}

document.addEventListener("DOMContentLoaded", initFormsBundle);
document.addEventListener("components:loaded", initFormsBundle);
