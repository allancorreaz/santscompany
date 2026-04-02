// ========== Funções de reCAPTCHA e envio de formulário migradas de main.js ==========
function getCaptchaResponse(form) {
  if (typeof window.grecaptcha === "undefined") return "";

  const captchaElement = form.querySelector(".g-recaptcha");
  if (!captchaElement) return "";

  const widgetId = captchaElement.dataset.widgetId;
  if (widgetId === undefined) return window.grecaptcha.getResponse();

  return window.grecaptcha.getResponse(Number(widgetId));
}

function resetCaptcha(form) {
  if (typeof window.grecaptcha === "undefined") return;

  const captchaElement = form.querySelector(".g-recaptcha");
  if (!captchaElement) return;

  const widgetId = captchaElement.dataset.widgetId;
  if (widgetId === undefined) {
    window.grecaptcha.reset();
    return;
  }

  window.grecaptcha.reset(Number(widgetId));
}

function ensureCaptchaWidgets() {
  if (typeof window.grecaptcha === "undefined" || typeof window.grecaptcha.render !== "function") return;

  document.querySelectorAll(".g-recaptcha").forEach((captchaElement) => {
    if (captchaElement.dataset.widgetId) return;

    const sitekey = captchaElement.dataset.sitekey;
    const widgetId = window.grecaptcha.render(captchaElement, {
      sitekey,
      theme: captchaElement.dataset.theme || "light",
    });

    captchaElement.dataset.widgetId = String(widgetId);
  });
}

async function parseContactResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      success: false,
      message: response.ok
        ? "O servidor respondeu, mas retornou um formato inesperado."
        : "O envio automático não respondeu corretamente.",
      error: text
    };
  }
}

function resolveContactEndpoint(form) {
  return form.getAttribute("action") || "./server/contact.php";
}

function initContactForms() {
  ensureCaptchaWidgets();

  document.querySelectorAll(".contact-form").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    // Outro qual? field logic
    const serviceSelect = form.querySelector('select[name="serviceType[]"]');
    const otherContainer = form.querySelector('#otherServiceContainer');
    const otherInput = form.querySelector('#otherServiceInput');
    if (serviceSelect && otherContainer && otherInput) {
      const toggleOtherField = () => {
        const selected = Array.from(serviceSelect.selectedOptions).map(opt => opt.value);
        if (selected.includes('Outro')) {
          otherContainer.style.display = '';
          otherInput.required = true;
        } else {
          otherContainer.style.display = 'none';
          otherInput.required = false;
          otherInput.value = '';
        }
      };
      serviceSelect.addEventListener('change', toggleOtherField);
      toggleOtherField();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type=submit]");
      if (!button) return;

      const originalText = button.innerHTML;
      const captchaResponse = getCaptchaResponse(form);

      if (!captchaResponse) {
        button.innerHTML = '<i class="fas fa-shield-halved"></i> Confirme o reCAPTCHA.';
        button.style.backgroundColor = "#b45309";
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = "";
        }, 3000);
        return;
      }

      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      button.disabled = true;

      try {
        const formData = new FormData(form);
        formData.set("g-recaptcha-response", captchaResponse);

        const response = await fetch(resolveContactEndpoint(form), {
          method: "POST",
          body: formData,
        });

        const result = await parseContactResponse(response);

        if (!response.ok || !result.success) {
          let msg = result.message || "Não foi possível enviar.";
          if (result.error) {
            msg += `<br><small style='font-size:0.9em;color:#fff;'>${result.error}</small>`;
          }
          button.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${msg}`;
          button.style.backgroundColor = "#dc2626";
        } else {
          button.innerHTML = '<i class="fas fa-check"></i> Mensagem enviada!';
          button.style.backgroundColor = "#16a34a";
          form.reset();
          resetCaptcha(form);
        }
      } catch (error) {
        button.innerHTML = '<i class="fas fa-circle-info"></i> Envio indisponível. Use WhatsApp ou e-mail.';
        button.style.backgroundColor = "#b45309";
        resetCaptcha(form);
      } finally {
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = "";
          button.disabled = false;
        }, 4500);
      }
    });
  });
}

// Inicialização do forms (custom select + recaptcha + envio)
function initFormsBundle() {
  if (typeof initCustomSelects === 'function') initCustomSelects();
  initContactForms();
}

document.addEventListener("DOMContentLoaded", initFormsBundle);
document.addEventListener("components:loaded", initFormsBundle);
window.addEventListener("load", ensureCaptchaWidgets);
window.onRecaptchaReady = ensureCaptchaWidgets;
function initCustomSelects(root = document) {
  root.querySelectorAll('.custom-select-wrapper').forEach(function (wrapper) {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = "true";

    const nativeSelect = wrapper.querySelector('select');
    if (!nativeSelect) return;

    // 🔥 força multi-select real
    nativeSelect.multiple = true;

    // Remove versões antigas
    wrapper.querySelectorAll('.custom-select, .custom-options').forEach(e => e.remove());

    // Criar botão
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.tabIndex = 0;

    customSelect.innerHTML = `
      <div class="selected placeholder">Selecione o seu serviço</div>
      <span class="arrow">&#9662;</span>
    `;

    wrapper.appendChild(customSelect);

    // Lista
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-options';
    wrapper.appendChild(optionsList);

    Array.from(nativeSelect.options).forEach(function (opt) {
      if (opt.disabled && opt.value === "") return;

      const div = document.createElement('div');
      div.className = 'option';
      div.textContent = opt.textContent;
      div.dataset.value = opt.value;

      if (opt.selected) div.classList.add('selected');

      optionsList.appendChild(div);
    });

    function updateDisplay() {
      const selected = Array.from(nativeSelect.selectedOptions).filter(o => o.value);
      const display = customSelect.querySelector('.selected');

      display.innerHTML = '';

      if (!selected.length) {
        display.textContent = 'Selecione o seu serviço';
        display.classList.add('placeholder');
      } else {
        display.classList.remove('placeholder');

        selected.forEach(opt => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = opt.textContent;

          const removeBtn = document.createElement('span');
          removeBtn.className = 'remove-tag';
          removeBtn.innerHTML = '&times;';
          removeBtn.dataset.value = opt.value;

          removeBtn.addEventListener('click', function (e) {
            e.stopPropagation();

            opt.selected = false;

            const optionDiv = optionsList.querySelector(`[data-value="${opt.value}"]`);
            if (optionDiv) optionDiv.classList.remove('selected');

            updateDisplay();
          });

          tag.appendChild(removeBtn);
          display.appendChild(tag);
        });
      }

      const form = wrapper.closest('form');
      if (form) {
        const otherContainer = form.querySelector('#otherServiceContainer');
        if (otherContainer) {
          otherContainer.style.display =
            selected.some(o => o.value === 'Outro') ? 'block' : 'none';
        }
      }
    }

    function toggleDropdown() {
      customSelect.classList.toggle('open');
    }

    function closeDropdown() {
      customSelect.classList.remove('open');
    }

    customSelect.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) closeDropdown();
    });

    optionsList.addEventListener('click', function (e) {
      if (!e.target.classList.contains('option')) return;

      const value = e.target.dataset.value;
      const option = Array.from(nativeSelect.options).find(o => o.value === value);
      if (!option) return;

      option.selected = !option.selected;
      e.target.classList.toggle('selected');

      updateDisplay();
    });

    nativeSelect.addEventListener('change', updateDisplay);

    updateDisplay();
  });
}

/* AUTO-DETECÇÃO */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        if (node.matches?.('.custom-select-wrapper') || node.querySelector?.('.custom-select-wrapper')) {
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

/* INIT */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initCustomSelects());
} else {
  initCustomSelects();
}