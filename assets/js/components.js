(function injectGlobalComponents() {
  const nestedPaths = ["/blog/", "/pages/"];

  function getBasePath() {
    const pathname = window.location.pathname.replace(/\\/g, "/");
    return nestedPaths.some((segment) => pathname.includes(segment)) ? "../" : "./";
  }

  function resolveTemplate(html, basePath) {
    return html.replaceAll("{{BASE_PATH}}", basePath);
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
      console.log(`[Components] Container não encontrado: ${selector}`);
      return Promise.resolve();
    }

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((html) => {
        container.innerHTML = resolveTemplate(html, basePath);
        console.log(`[Components] ${selector} injetado com sucesso`);
      })
      .catch((error) => {
        console.error("Erro ao injetar componente:", error);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const basePath = getBasePath();
    console.log("[Components] Base path:", basePath);
    console.log("[Components] Location pathname:", window.location.pathname);

    const injections = [
      inject(".global-header", `${basePath}components/header.html`, basePath),
      inject(".global-footer", `${basePath}components/footer.html`, basePath),
      inject(".import-portfolio", `${basePath}components/portfolio.html`, basePath),
      inject(".import-contact-form", `${basePath}components/contact-form.html`, basePath),
      inject(".import-reviews-google", `${basePath}components/reviews-google.html`, basePath),
      inject(".import-numeros-q-falam", `${basePath}components/numeros-q-falam.html`, basePath),
    ];

    // Após injetar contact-form, garantir que reCAPTCHA widgets sejam renderizados
    Promise.resolve(injections[3]).then(() => {
      if (typeof window.ensureCaptchaWidgets === "function") {
        window.ensureCaptchaWidgets();
      }
    });

    Promise.all(injections)
      .then(() => {
        applyActiveState();
        
        // Re-inicializar animações de reveal para elementos injetados
        if (typeof window.initReveal === "function") {
          window.initReveal();
        }
        
        console.log("[Components] Todos os componentes foram injetados!");
        document.dispatchEvent(new CustomEvent("components:loaded"));
      })
      .catch((error) => {
        console.error("[Components] Erro ao injetar componentes:", error);
      });
  });
})();
