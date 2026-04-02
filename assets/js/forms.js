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

document.addEventListener("DOMContentLoaded", initContactForms);
window.onRecaptchaReady = ensureCaptchaWidgets;