function initHero() {
  const heroContainer = document.querySelector(".hero .container");
  if (heroContainer) {
    heroContainer.classList.add("hero-visible");
  }
}

// Mantem o menu mobile sincronizado com o estado de acessibilidade.
function initMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".nav");

  if (!menuToggle || !nav) {
    return;
  }

  if (menuToggle.dataset.bound === "true") return;
  menuToggle.dataset.bound = "true";

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();

    const isActive = nav.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isActive ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (
      nav.classList.contains("active") &&
      !nav.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      nav.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initHeaderScroll() {
  if (window.__headerScrollBound) return;
  window.__headerScrollBound = true;

  const header = document.querySelector(".header");
  if (!header) return;

  let ticking = false;

  const toggleHeaderState = () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  };

  const raf = window.requestAnimationFrame || function (callback) {
    return window.setTimeout(callback, 16);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    raf(() => {
      toggleHeaderState();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  toggleHeaderState();
}

function initReveal() {
  if (window.__revealBound) return;
  window.__revealBound = true;

  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  if (typeof window.IntersectionObserver !== "function") {
    reveals.forEach((elem) => elem.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach((elem) => observer.observe(elem));
}

function initCards() {}
function initCounters() {}

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

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
}

function createThemeToggleButton() {
  let button = document.querySelector(".theme-toggle");
  if (button) return button;

  button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.setAttribute("aria-label", "Alternar modo noturno");
  document.body.appendChild(button);
  return button;
}

function updateThemeToggleLabel(button, theme) {
  if (!button) return;
  const isDark = theme === "dark";
  button.innerHTML = isDark
    ? '<i class="fas fa-sun" aria-hidden="true"></i>'
    : '<i class="fas fa-moon" aria-hidden="true"></i>';
  button.setAttribute("title", isDark ? "Ativar modo claro" : "Ativar modo noturno");
  button.setAttribute("aria-pressed", isDark ? "true" : "false");
}

function initThemeToggle() {
  const storageKey = "sants-theme";
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const button = createThemeToggleButton();

  const preferredFromStorage = window.localStorage.getItem(storageKey);
  const initialTheme = preferredFromStorage || (colorSchemeQuery.matches ? "dark" : "light");
  applyTheme(initialTheme);
  updateThemeToggleLabel(button, initialTheme);
  button.style.display = "inline-flex";

  if (button.dataset.bound === "true") return;
  button.dataset.bound = "true";

  button.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    applyTheme(nextTheme);
    updateThemeToggleLabel(button, nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  });
}

function initHeroMediaBackgrounds() {
  const heroes = document.querySelectorAll(".hero, .page-hero");
  if (!heroes.length) return;

  heroes.forEach((hero) => {
    const imageSrc = hero.dataset.heroBgImage;
    const videoSrc = hero.dataset.heroBgVideo;
    const videoPoster = hero.dataset.heroBgPoster;

    if (!imageSrc && !videoSrc) return;

    hero.classList.add("has-media-bg");
    const existingMedia = hero.querySelector(".hero-bg-media");
    if (existingMedia) existingMedia.remove();

    if (videoSrc) {
      const video = document.createElement("video");
      video.className = "hero-bg-media";
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      if (videoPoster) video.poster = videoPoster;

      const source = document.createElement("source");
      source.src = videoSrc;
      source.type = "video/mp4";
      video.appendChild(source);

      hero.prepend(video);
      return;
    }

    const image = document.createElement("img");
    image.className = "hero-bg-media";
    image.src = imageSrc;
    image.alt = "";
    image.loading = "eager";
    image.decoding = "async";
    image.setAttribute("aria-hidden", "true");
    hero.prepend(image);
  });
}

function initContactChoice() {
  if (window.__contactChoiceBound) return;
  window.__contactChoiceBound = true;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-contact-choice]");
    if (trigger) {
      event.preventDefault();
      const dialog = document.getElementById("contactChoiceDialog");
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
      return;
    }

    const closeButton = event.target.closest("[data-contact-choice-close]");
    if (closeButton) {
      const dialog = document.getElementById("contactChoiceDialog");
      if (dialog && typeof dialog.close === "function") dialog.close();
    }
  });
}

function initContactChoiceDialog() {
  const dialog = document.getElementById("contactChoiceDialog");
  if (!dialog || dialog.dataset.bound === "true") return;
  dialog.dataset.bound = "true";

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function initSite() {
  initHero();
  initHeroMediaBackgrounds();
  initMenu();
  initHeaderScroll();
  initReveal();
  initCards();
  initCounters();
  initFloatingButtons();
  initThemeToggle();
  initContactChoice();
}

function loadFontAwesomeDeferred() {
  if (document.getElementById("fa-deferred-css")) return;

  const link = document.createElement("link");
  link.id = "fa-deferred-css";
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
  link.media = "print";
  link.onload = function () {
    this.media = "all";
  };
  document.head.appendChild(link);
}

function scheduleDeferredAssets() {
  const run = () => loadFontAwesomeDeferred();

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1500 });
    return;
  }

  window.setTimeout(run, 900);
}

document.addEventListener("DOMContentLoaded", () => {
  initSite();
  scheduleDeferredAssets();
});

document.addEventListener("components:loaded", () => {
  initMenu();
  initFloatingButtons();
  initContactChoiceDialog();
  window.__revealBound = false;
  initReveal();
});
