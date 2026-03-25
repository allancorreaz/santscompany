function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.classList.add("loader-hidden");
  }
}

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

  window.addEventListener("scroll", toggleHeaderState);
  toggleHeaderState();
}

function initReveal() {
  if (window.__revealBound) return;
  window.__revealBound = true;

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    document.querySelectorAll(".reveal").forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < windowHeight - 50) {
        element.classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
}

function initCards() {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.dataset.bound === "true") return;
    card.dataset.bound = "true";

    card.addEventListener("mousemove", (event) => {
      if (window.innerWidth <= 768) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = -(y - centerY) / 15;
      const rotateY = (x - centerX) / 15;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });

    card.addEventListener("click", () => {
      if (window.innerWidth > 768) return;

      card.classList.add("active-mobile");
      setTimeout(() => {
        card.classList.remove("active-mobile");
      }, 400);
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
    if (rect.top > window.innerHeight - 150) return;

    countersAnimated = true;
    counters.forEach((counter) => {
      const target = Number(counter.getAttribute("data-target"));
      const suffix = counter.getAttribute("data-suffix") || "";
      const duration = 1800;
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

  window.addEventListener("scroll", animateCounters);
  animateCounters();
}

function initContactForm() {
  const form = document.querySelector("#contactForm");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = form.querySelector("button[type=submit]");
    if (!button) return;

    const originalText = button.innerHTML;
    const hasCaptcha = typeof window.grecaptcha !== "undefined";
    const captchaResponse = hasCaptcha ? window.grecaptcha.getResponse() : "";

    if (hasCaptcha && !captchaResponse) {
      button.innerHTML = '<i class="fas fa-robot"></i> Complete a verificação anti-robô!';
      button.style.backgroundColor = "#f59e0b";

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
      if (captchaResponse) {
        formData.append("g-recaptcha-response", captchaResponse);
      }

      const response = await fetch("send.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        button.innerHTML = '<i class="fas fa-check"></i> Enviado! Responderemos em breve.';
        button.style.backgroundColor = "#22c55e";
        form.reset();
        if (hasCaptcha) {
          window.grecaptcha.reset();
        }
      } else {
        button.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${result.message}`;
        button.style.backgroundColor = "#ef4444";
      }
    } catch (error) {
      button.innerHTML = '<i class="fas fa-wifi"></i> Sem conexão. Verifique sua internet.';
      button.style.backgroundColor = "#ef4444";
    } finally {
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = "";
        button.disabled = false;
      }, 5000);
    }
  });
}

function initLegacyContactForm() {
  const form = document.querySelector(".contact-form:not(#contactForm)");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    if (!button) return;

    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Mensagem enviada!';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      form.reset();
    }, 2500);
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
      }, 150);
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
  initContactForm();
  initLegacyContactForm();
  initFloatingButtons();
}

window.addEventListener("load", hideLoader);
document.addEventListener("DOMContentLoaded", initSite);
document.addEventListener("components:loaded", initSite);
