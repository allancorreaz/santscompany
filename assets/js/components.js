(function injectGlobalComponents() {
  function getBasePath() {
    const pathname = window.location.pathname.replace(/\\/g, "/");

    // Blog post pages are nested one level deeper than /blog and /pages.
    if (/\/blog\/posts(?:\/|$)/.test(pathname)) {
      return "../../";
    }

    if (/\/blog(?:\/|$)/.test(pathname) || /\/pages(?:\/|$)/.test(pathname)) {
      return "../";
    }

    return "./";
  }

  function resolveTemplate(html, basePath) {
    const recaptchaSiteKey = window.SANTS_CONFIG && window.SANTS_CONFIG.recaptchaSiteKey
      ? window.SANTS_CONFIG.recaptchaSiteKey
      : "";
    return html
      .split("{{BASE_PATH}}")
      .join(basePath)
      .split("{{RECAPTCHA_SITE_KEY}}")
      .join(recaptchaSiteKey);
  }

  function withAssetVersion(url) {
    const version = window.SANTS_CONFIG && window.SANTS_CONFIG.assetVersion
      ? String(window.SANTS_CONFIG.assetVersion)
      : "";

    if (!version) return url;

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  }

  function applyActiveState() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;

    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function inject(selector, url, basePath) {
    const container = document.querySelector(selector);
    if (!container) {
      return Promise.resolve();
    }

    return fetch(withAssetVersion(url), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((html) => {
        container.innerHTML = resolveTemplate(html, basePath);
      })
      .catch((error) => {
        console.error("Erro ao injetar componente:", error);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const basePath = getBasePath();

    const injections = [
      inject(".global-header", `${basePath}components/header.html`, basePath),
      inject(".global-footer", `${basePath}components/footer.html`, basePath),
      inject(".import-portfolio", `${basePath}components/portfolio.html`, basePath),
      inject(".import-contact-form", `${basePath}components/contact-form.html`, basePath),
      inject(".import-numeros-q-falam", `${basePath}components/numeros-q-falam.html`, basePath),
      inject(".import-services", `${basePath}components/services.html`, basePath),
    ];

    Promise.all(injections)
      .then(() => {
        applyActiveState();

        if (typeof window.initReveal === "function") {
          window.initReveal();
        }

        let event;
        if (typeof window.CustomEvent === "function") {
          event = new CustomEvent("components:loaded");
        } else {
          event = document.createEvent("Event");
          event.initEvent("components:loaded", false, false);
        }
        document.dispatchEvent(event);
      })
      .catch((error) => {
        console.error("[Components] Erro ao injetar componentes:", error);
      });
  });
})();
