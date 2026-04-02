// Carrossel infinito e autoplay suave para o portfolio
function initPortfolioCarousel() {
  document.querySelectorAll(".portfolio-grid").forEach((carousel) => {
    if (carousel.__portfolioController) {
      carousel.__portfolioController.sync();
      return;
    }

    const originalItems = Array.from(carousel.children);
    if (!originalItems.length) return;

    let autoplayPaused = false;
    let animationFrameId = 0;
    let lastTimestamp = 0;
    let originalTrackWidth = 0;
    let resumeTimeoutId = 0;
    let resizeTimeoutId = 0;
    let enabled = false;

    function isMobileViewport() {
      return window.innerWidth <= 768;
    }

    function clearClones() {
      carousel.querySelectorAll("[data-clone='true']").forEach((clone) => clone.remove());
    }

    function measureOriginalTrackWidth() {
      const firstItem = originalItems[0];
      const lastItem = originalItems[originalItems.length - 1];
      if (!firstItem || !lastItem) return 0;

      const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
      return (lastItem.offsetLeft + lastItem.offsetWidth) - firstItem.offsetLeft + gap;
    }

    function buildLoopTrack() {
      clearClones();
      originalTrackWidth = measureOriginalTrackWidth();
      if (!originalTrackWidth) return;

      const extraSets = Math.max(2, Math.ceil((carousel.clientWidth * 2) / originalTrackWidth));

      for (let copyIndex = 0; copyIndex < extraSets; copyIndex += 1) {
        originalItems.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.dataset.clone = "true";
          clone.setAttribute("aria-hidden", "true");
          carousel.appendChild(clone);
        });
      }

      originalTrackWidth = measureOriginalTrackWidth();
      carousel.scrollLeft = 0;
    }

    function pauseAutoplay() {
      if (!enabled) return;
      autoplayPaused = true;
      window.clearTimeout(resumeTimeoutId);
    }

    function resumeAutoplay(delay = 0) {
      if (!enabled) return;
      window.clearTimeout(resumeTimeoutId);
      resumeTimeoutId = window.setTimeout(() => {
        autoplayPaused = false;
      }, delay);
    }

    function animate(timestamp) {
      if (!enabled) return;

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const delta = Math.min(timestamp - lastTimestamp, 48);
      lastTimestamp = timestamp;

      if (!autoplayPaused && !document.hidden && originalTrackWidth > 0) {
        carousel.scrollLeft += (18 * delta) / 1000;

        if (carousel.scrollLeft >= originalTrackWidth) {
          carousel.scrollLeft -= originalTrackWidth;
        }
      }

      animationFrameId = window.requestAnimationFrame(animate);
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      autoplayPaused = false;
      lastTimestamp = 0;
      carousel.classList.add("portfolio-carousel");
      buildLoopTrack();
      animationFrameId = window.requestAnimationFrame(animate);
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(resumeTimeoutId);
      lastTimestamp = 0;
      originalTrackWidth = 0;
      clearClones();
      carousel.classList.remove("portfolio-carousel");
      carousel.scrollLeft = 0;
    }

    function sync() {
      if (isMobileViewport()) {
        enable();
      } else {
        disable();
      }
    }

    function handleResize() {
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(() => {
        sync();
        if (enabled) {
          buildLoopTrack();
          lastTimestamp = 0;
        }
      }, 120);
    }

    carousel.addEventListener("mouseenter", pauseAutoplay);
    carousel.addEventListener("mouseleave", () => resumeAutoplay());
    carousel.addEventListener("touchstart", pauseAutoplay, { passive: true });
    carousel.addEventListener("touchend", () => resumeAutoplay(1800), { passive: true });
    carousel.addEventListener("pointerdown", pauseAutoplay);
    carousel.addEventListener("pointerup", () => resumeAutoplay(1800));
    carousel.addEventListener("wheel", () => {
      pauseAutoplay();
      resumeAutoplay(1800);
    }, { passive: true });
    carousel.addEventListener("focusin", pauseAutoplay);
    carousel.addEventListener("focusout", () => resumeAutoplay(1200));
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        lastTimestamp = 0;
      }
    });

    carousel.__portfolioController = { sync };
    sync();
  });
}

function initHero() {
  document.querySelector(".hero .container")?.classList.add("hero-visible");
}

function initMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".nav");
  if (!menuToggle || !nav || menuToggle.dataset.bound === "true") return;

  if (!nav.id) {
    nav.id = "siteNav";
  }

  const closeMenu = () => {
    nav.classList.remove("active");
    menuToggle.classList.remove("is-active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  };

  menuToggle.dataset.bound = "true";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  menuToggle.addEventListener("click", () => {
    const isActive = nav.classList.toggle("active");
    menuToggle.classList.toggle("is-active", isActive);
    menuToggle.setAttribute("aria-expanded", String(isActive));
    menuToggle.setAttribute("aria-label", isActive ? "Fechar menu" : "Abrir menu");
  });

  document.querySelectorAll(".nav-link, .nav-cta").forEach((link) => {
    if (link.dataset.bound === "true") return;
    link.dataset.bound = "true";
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("active")) return;
    if (nav.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
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

// ...restante do código...
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
  initPortfolioCarousel();
}

document.addEventListener("DOMContentLoaded", initSite);
document.addEventListener("components:loaded", initSite);
window.addEventListener("load", ensureCaptchaWidgets);
window.onRecaptchaReady = ensureCaptchaWidgets;
