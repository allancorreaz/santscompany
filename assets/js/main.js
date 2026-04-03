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
  
  if (!menuToggle || !nav) {
    console.log("[Menu] Elementos não encontrados. Tentando novamente em 100ms...");
    setTimeout(initMenu, 100);
    return;
  }

  if (menuToggle.dataset.menuBound === "true") {
    return;
  }

  menuToggle.dataset.menuBound = "true";

  console.log("[Menu] Elementos encontrados. Inicializando...");

  // Click no botão hamburguer
  menuToggle.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isActive = nav.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isActive ? "true" : "false");
    console.log("[Menu] Menu " + (isActive ? "ABERTO" : "FECHADO"));
    console.log("[Menu] Classes do nav:", nav.className);
  });

  // Click em links fecha o menu
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function(e) {
      // Permite que links com target="_blank" funcionem
      if (!this.target || this.target !== "_blank") {
        nav.classList.remove("active");
        console.log("[Menu] Menu fechado por clique em link");
      }
    });
  });

  // Click fora do menu fecha
  if (!window.__menuDocBound) {
    window.__menuDocBound = true;
    document.addEventListener("click", function(e) {
      const currentNav = document.querySelector(".nav");
      const currentToggle = document.getElementById("menuToggle");

      if (!currentNav || !currentToggle) return;

      if (currentNav.classList.contains("active")) {
        if (!currentNav.contains(e.target) && !currentToggle.contains(e.target)) {
          currentNav.classList.remove("active");
          currentToggle.setAttribute("aria-expanded", "false");
          console.log("[Menu] Menu fechado por clique fora");
        }
      }
    });
  }

  console.log("[Menu] Inicializado com sucesso!");
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const reveals = document.querySelectorAll(".reveal");
  console.log(`[initReveal] Observando ${reveals.length} elementos com classe .reveal`);
  reveals.forEach(elem => {
    observer.observe(elem);
  });
}

function initCards() {
  // Função para inicializar lógica dos cards se necessário
  // Por enquanto, pode estar vazia se os cards não requerem JS dinâmico
}

function initCounters() {
  // Função para inicializar contadores se necessário
  // Por enquanto, pode estar vazia se os contadores não requerem JS dinâmico
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
  console.log("[initSite] Iniciando inicializações da página...");
  initHero();
  initMenu();
  initHeaderScroll();
  initReveal();
  initCards();
  initCounters();
  initFloatingButtons();
  initPortfolioCarousel();
  console.log("[initSite] Todas as inicializações foram completadas!");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Main] DOMContentLoaded disparado");
  initSite();
});

document.addEventListener("components:loaded", () => {
  console.log("[Main] components:loaded disparado - reinicializando menu e reveal");
  initMenu();
  window.__revealBound = false;
  initReveal();
});
