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
      theme: "light",
    });

    captchaElement.dataset.widgetId = String(widgetId);
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
  return "send.php";
}

function initContactForms() {
  ensureCaptchaWidgets();

  document.querySelectorAll(".contact-form").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type=submit]");
      const originalText = button.innerHTML;

      const captchaResponse = getCaptchaResponse(form);

      if (!captchaResponse) {
        button.innerHTML = "Confirme o reCAPTCHA";
        button.style.backgroundColor = "#b45309";
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = "";
        }, 3000);
        return;
      }

      button.innerHTML = "Enviando...";
      button.disabled = true;

      try {
        const formData = new FormData(form);
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
          resetCaptcha(form);
        }

      } catch {
        button.innerHTML = "Erro de conexão";
        button.style.backgroundColor = "#b45309";
      }

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = "";
        button.disabled = false;
      }, 4000);
    });
  });
}

/* ================================
   CUSTOM SELECT INITIALIZATION (Multi-Select)
================================ */
function initCustomSelects(root = document) {
  root.querySelectorAll('.custom-select-wrapper').forEach(function (wrapper) {
    if (wrapper.dataset.initialized === 'true') return;
    wrapper.dataset.initialized = 'true';

    const nativeSelect = wrapper.querySelector('select');
    if (!nativeSelect) return;

    // Limpar versões antigas
    wrapper.querySelectorAll('.custom-select, .custom-options').forEach(e => e.remove());

    // Criar display do select customizado
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.tabIndex = 0;
    wrapper.appendChild(customSelect);

    // Criar lista de opções
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-options';
    wrapper.appendChild(optionsList);

    // Popular opções
    Array.from(nativeSelect.options).forEach(function (opt, idx) {
      const optDiv = document.createElement('div');
      optDiv.className = 'option';
      optDiv.textContent = opt.textContent;
      optDiv.dataset.index = idx;
      optDiv.dataset.value = opt.value;
      optionsList.appendChild(optDiv);
    });

    // Função para atualizar o display
    function updateDisplay() {
      const selectedOptions = Array.from(nativeSelect.selectedOptions);
      customSelect.innerHTML = '';

      if (selectedOptions.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = 'Selecione o seu serviço';
        customSelect.appendChild(placeholder);
        customSelect.appendChild(document.createElement('span')).className = 'arrow';
        customSelect.querySelector('.arrow').textContent = '▼';
      } else {
        const tagContainer = document.createElement('div');
        tagContainer.style.display = 'flex';
        tagContainer.style.flexWrap = 'wrap';
        tagContainer.style.gap = '6px';
        tagContainer.style.flex = '1';

        selectedOptions.forEach(opt => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.style.display = 'inline-flex';
          tag.style.alignItems = 'center';
          tag.style.gap = '4px';
          tag.style.background = '#e0e7ff';
          tag.style.color = '#3730a3';
          tag.style.padding = '4px 8px';
          tag.style.borderRadius = '6px';
          tag.style.fontSize = '0.85rem';

          const text = document.createElement('span');
          text.textContent = opt.textContent;
          tag.appendChild(text);

          const removeBtn = document.createElement('span');
          removeBtn.className = 'remove-tag';
          removeBtn.textContent = '×';
          removeBtn.style.cursor = 'pointer';
          removeBtn.style.fontWeight = 'bold';
          removeBtn.style.color = '#3730a3';
          removeBtn.style.fontSize = '1.2rem';
          removeBtn.style.lineHeight = '1';
          removeBtn.style.display = 'flex';
          removeBtn.style.alignItems = 'center';
          removeBtn.style.justifyContent = 'center';

          removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            opt.selected = false;
            updateDisplay();
            updateOptionsUI();
          });

          tag.appendChild(removeBtn);
          tagContainer.appendChild(tag);
        });

        customSelect.appendChild(tagContainer);
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '▼';
        arrow.style.marginLeft = 'auto';
        customSelect.appendChild(arrow);
      }

      // Mostrar/ocultar campo "Outro"
      const form = wrapper.closest('form');
      if (form) {
        const otherContainer = form.querySelector('#otherServiceContainer');
        if (otherContainer) {
          const hasOutro = selectedOptions.some(o => o.value === 'Outro');
          otherContainer.style.display = hasOutro ? 'block' : 'none';
        }
      }
    }

    // Função para atualizar visual das opções
    function updateOptionsUI() {
      Array.from(nativeSelect.options).forEach((opt, idx) => {
        const optDiv = optionsList.querySelector(`[data-index="${idx}"]`);
        if (optDiv) {
          if (opt.selected) {
            optDiv.classList.add('selected');
          } else {
            optDiv.classList.remove('selected');
          }
        }
      });
    }

    // Toggle dropdown
    customSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      customSelect.classList.toggle('open');
    });

    // Fechar dropdown quando clicar fora
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        customSelect.classList.remove('open');
      }
    });

    // Clicar em opção
    optionsList.addEventListener('click', (e) => {
      if (!e.target.classList.contains('option')) return;

      const index = parseInt(e.target.dataset.index);
      const option = nativeSelect.options[index];
      if (option) {
        option.selected = !option.selected;
        updateDisplay();
        updateOptionsUI();
      }
    });

    // Atualizar quando select nativo muda
    nativeSelect.addEventListener('change', () => {
      updateDisplay();
      updateOptionsUI();
    });

    // Inicializar
    updateDisplay();
    updateOptionsUI();
  });
}

/* Auto-detect new selects when DOM changes */
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

/* ================================
   UNIFIED FORMS INITIALIZATION
================================ */
function initFormsBundle() {
  initCustomSelects();
  initContactForms();
}

document.addEventListener("DOMContentLoaded", initFormsBundle);
document.addEventListener("components:loaded", initFormsBundle);
window.onRecaptchaReady = ensureCaptchaWidgets;