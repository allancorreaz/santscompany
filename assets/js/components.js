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
    if (!container) return Promise.resolve();

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar componente global.");
        }
        return response.text();
      })
      .then((html) => {
        container.innerHTML = resolveTemplate(html, basePath);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const basePath = getBasePath();

    Promise.all([
      inject(".global-header", `${basePath}components/header.html`, basePath),
      inject(".global-footer", `${basePath}components/footer.html`, basePath),
    ]).then(() => {
      applyActiveState();
      document.dispatchEvent(new CustomEvent("components:loaded"));
    });
  });
})();
