function initHero() {
  document.querySelector(".hero .container")?.classList.add("hero-visible");
}

function initMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".nav");
  if (!menuToggle || !nav || menuToggle.dataset.bound === "true") return;

  menuToggle.dataset.bound = "true";
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("active");
  });

  document.querySelectorAll(".nav-link, .nav-cta").forEach((link) => {
    if (link.dataset.bound === "true") return;
    link.dataset.bound = "true";
    link.addEventListener("click", () => nav.classList.remove("active"));
  });
}

function initHeaderScroll() {
  if (window.__headerScrollBound) return;
  window.__headerScrollBound = true;

  const toggleHeaderState = () => {
    const header = document.querySelector(".header");
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 50);
  };

  window.addEventListener("scroll", toggleHeaderState, { passive: true });
  toggleHeaderState();
}

function initReveal() {
  if (window.__revealBound) return;
  window.__revealBound = true;

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    document.querySelectorAll(".reveal").forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < windowHeight - 60) {
        element.classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", revealOnScroll, { passive: true });
  revealOnScroll();
}

function initCards() {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.dataset.bound === "true") return;
    card.dataset.bound = "true";

    card.addEventListener("mousemove", (event) => {
      if (window.innerWidth <= 1024) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = -(y - centerY) / 18;
      const rotateY = (x - centerX) / 18;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initCounters() {
  if (window.__counterBound) return;
  window.__counterBound = true;

  let countersAnimated = false;

  const animateCounters = () => {
    const counterSection = document.querySelector(".stats-section");
    const counters = document.querySelectorAll(".count");
    if (!counterSection || !counters.length || countersAnimated) return;

    const rect = counterSection.getBoundingClientRect();
    if (rect.top > window.innerHeight - 140) return;

    countersAnimated = true;
    counters.forEach((counter) => {
      const target = Number(counter.getAttribute("data-target"));
      const suffix = counter.getAttribute("data-suffix") || "";
      const duration = 1600;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const current = Math.round(easeOut * target);
        counter.innerHTML = current + (suffix ? `<span class="suffix">${suffix}</span>` : "");
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
    });
  };

  window.addEventListener("scroll", animateCounters, { passive: true });
  animateCounters();
}

function resolveContactEndpoint(form) {
  return form.getAttribute("action") || "./server/contact.php";
}

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
    };
  }
}

function initContactForms() {
  ensureCaptchaWidgets();

  document.querySelectorAll(".contact-form").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

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
          button.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${result.message || "Não foi possível enviar."}`;
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

function initFloatingButtons() {
  const floatingButtons = document.querySelector(".floating-buttons");
  if (!floatingButtons) return;

  const toggleFloatingButtons = () => {
    floatingButtons.style.display = window.innerWidth <= 768 ? "flex" : "none";
  };

  if (!window.__floatingButtonsBound) {
    window.__floatingButtonsBound = true;
    window.addEventListener("resize", toggleFloatingButtons);
  }

  document.querySelectorAll(".floating-btn").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 120);
    });
  });

  toggleFloatingButtons();
}

function initSite() {
  initHero();
  initMenu();
  initHeaderScroll();
  initReveal();
  initCards();
  initCounters();
  initContactForms();
  initFloatingButtons();
}

document.addEventListener("DOMContentLoaded", initSite);
document.addEventListener("components:loaded", initSite);
window.addEventListener("load", ensureCaptchaWidgets);
window.onRecaptchaReady = ensureCaptchaWidgets;
