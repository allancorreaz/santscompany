const htmlEntityBuffer = document.createElement("textarea");

function decodeHtmlEntities(text) {
  htmlEntityBuffer.innerHTML = String(text || "");
  return htmlEntityBuffer.value;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url, fallback = "#") {
  const value = String(url || "").trim();
  if (!value) return fallback;
  if (value.startsWith("./") || value.startsWith("../") || value.startsWith("/")) return value;

  try {
    const parsed = new URL(value, window.location.href);
    return /^https?:$/i.test(parsed.protocol) ? parsed.href : fallback;
  } catch (_error) {
    return fallback;
  }
}

function normalizeText(text) {
  return decodeHtmlEntities(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parsePtBrDate(dateText) {
  const match = String(dateText || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 0;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

function parsePublicationTimestamp(post) {
  const rawTimestamp = Number(post.timestamp || post.publishedAt || 0);
  if (Number.isFinite(rawTimestamp) && rawTimestamp > 0) {
    return rawTimestamp < 100000000000 ? rawTimestamp * 1000 : rawTimestamp;
  }

  const isoTimestamp = Date.parse(String(post.publishedAt || ""));
  return Number.isFinite(isoTimestamp) ? isoTimestamp : parsePtBrDate(post.date);
}

function compareByPublicationDate(left, right) {
  const timeDifference = parsePublicationTimestamp(right) - parsePublicationTimestamp(left);
  if (timeDifference !== 0) return timeDifference;

  return Number(right.id || 0) - Number(left.id || 0);
}
function renderState(container, message) {
  if (container) container.innerHTML = `<div class="blog-empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function renderPosts(posts, container) {
  if (!posts.length) {
    renderState(container, "Nenhum conteúdo encontrado para esta busca ou categoria.");
    return;
  }

  const linkAttributes = (post) => post.isOwn
    ? `href="${sanitizeUrl(post.url)}"`
    : `href="${sanitizeUrl(post.url)}" target="_blank" rel="noopener noreferrer"`;
  const sourceLabel = (post) => post.isOwn ? escapeHtml(post.sourceName) : `Fonte: ${escapeHtml(post.sourceName)}`;
  const readLabel = (post, compact = false) => post.isOwn
    ? (compact ? "Ler mais" : "Ler artigo completo")
    : (compact ? "Ler mais" : "Ler notícia completa");
  const externalIcon = (post) => post.isOwn ? "" : ' <i class="fas fa-external-link-alt"></i>';
  const [featuredPost, ...secondaryPosts] = posts;

  container.innerHTML = `
    <a ${linkAttributes(featuredPost)} class="blog-featured-card">
      <img src="${sanitizeUrl(featuredPost.banner, "../assets/images/branding/logo.png")}" alt="${escapeHtml(featuredPost.title)}" class="blog-featured-img" loading="lazy" decoding="async">
      <div class="blog-featured-content">
        <span class="blog-category-chip">${escapeHtml(featuredPost.category)}</span>
        <div class="blog-meta">${escapeHtml(featuredPost.date)} • ${escapeHtml(featuredPost.readingTime)} • ${sourceLabel(featuredPost)}</div>
        <h2>${escapeHtml(featuredPost.title)}</h2>
        <p>${escapeHtml(featuredPost.summary)}</p>
        <span class="blog-card-readmore">${readLabel(featuredPost)}${externalIcon(featuredPost)}</span>
      </div>
    </a>
    <div class="blog-cards">
      ${secondaryPosts.map((post) => `
        <a ${linkAttributes(post)} class="blog-card">
          <img src="${sanitizeUrl(post.banner, "../assets/images/branding/logo.png")}" alt="${escapeHtml(post.title)}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${escapeHtml(post.category)}</span>
            <div class="blog-card-meta">${escapeHtml(post.date)} • ${escapeHtml(post.readingTime)} • ${sourceLabel(post)}</div>
            <div class="blog-card-title">${escapeHtml(post.title)}</div>
            <div class="blog-card-excerpt">${escapeHtml(post.summary)}</div>
            <span class="blog-card-readmore">${readLabel(post, true)}${externalIcon(post)}</span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

const blogAssetVersion = window.SANTS_CONFIG && window.SANTS_CONFIG.assetVersion
  ? String(window.SANTS_CONFIG.assetVersion)
  : "";
const withVersion = (url) => blogAssetVersion ? `${url}?v=${encodeURIComponent(blogAssetVersion)}` : url;

Promise.all([
  fetch(withVersion("../data/blog/news.json"), { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("Falha ao carregar as notícias.");
    return response.json();
  }),
  fetch(withVersion("../data/blog/posts.json"), { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("Falha ao carregar os artigos.");
    return response.json();
  })
])
  .then(([newsItems, ownPosts]) => {
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
    const blogSearchInput = document.getElementById("blogSearchInput");
    const blogCategoryFilter = document.getElementById("blogCategoryFilter");
    if (!blogList || !blogWelcome) return;

    const externalPosts = (Array.isArray(newsItems) ? newsItems : []).map((item) => ({
      id: item.id,
      url: sanitizeUrl(item.url),
      title: decodeHtmlEntities(item.title),
      category: decodeHtmlEntities(item.category),
      banner: sanitizeUrl(item.banner, "../assets/images/branding/logo.png"),
      date: item.date,
      readingTime: item.readingTime,
      summary: decodeHtmlEntities(item.summary),
      sourceName: decodeHtmlEntities(item.sourceName),
      timestamp: item.timestamp,
      isOwn: false
    }));

    const institutionalPosts = (Array.isArray(ownPosts) ? ownPosts : [])
      .filter((post) => post.visible !== false)
      .map((post) => ({
        id: post.id,
        url: `./posts/${encodeURIComponent(post.id)}.html`,
        title: decodeHtmlEntities(post.title),
        category: decodeHtmlEntities(post.category),
        banner: sanitizeUrl(post.banner, "../assets/images/branding/logo.png"),
        date: post.date,
        readingTime: post.readingTime,
        summary: decodeHtmlEntities(post.summary),
        sourceName: "Sants Company",
        publishedAt: post.publishedAt || "",
        isOwn: true
      }));

    const visiblePosts = [...externalPosts, ...institutionalPosts].sort(compareByPublicationDate);
    if (!visiblePosts.length) {
      renderState(blogList, "Os conteúdos ainda estão sendo preparados. Tente novamente em alguns minutos.");
      return;
    }

    const categories = [...new Set(visiblePosts.map((post) => post.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    if (blogCategoryFilter && !blogCategoryFilter.dataset.enhanced) {
      blogCategoryFilter.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(""));
      const filterFieldLabel = blogCategoryFilter.closest(".blog-filter-field");
      const customDropdown = document.createElement("div");
      customDropdown.className = "custom-dropdown";
      const dropdownButton = document.createElement("button");
      dropdownButton.className = "custom-dropdown-button";
      dropdownButton.textContent = "Todas as categorias";
      dropdownButton.type = "button";
      const dropdownMenu = document.createElement("div");
      dropdownMenu.className = "custom-dropdown-menu";
      dropdownMenu.innerHTML = ['<div class="custom-dropdown-option" data-value="">Todas as categorias</div>', ...categories.map((category) => `<div class="custom-dropdown-option" data-value="${escapeHtml(category)}">${escapeHtml(category)}</div>`)].join("");
      customDropdown.append(dropdownButton, dropdownMenu);
      if (filterFieldLabel) filterFieldLabel.appendChild(customDropdown);
      blogCategoryFilter.style.display = "none";
      blogCategoryFilter.dataset.enhanced = "true";
      const closeDropdown = () => customDropdown.classList.remove("open");
      dropdownButton.addEventListener("click", (event) => {
        event.stopPropagation();
        customDropdown.classList.toggle("open");
      });
      customDropdown.addEventListener("mouseenter", () => customDropdown.classList.add("open"));
      customDropdown.addEventListener("mouseleave", closeDropdown);
      document.addEventListener("click", (event) => {
        if (!customDropdown.contains(event.target)) closeDropdown();
      });
      dropdownMenu.querySelectorAll(".custom-dropdown-option").forEach((option) => {
        option.addEventListener("click", () => {
          blogCategoryFilter.value = option.getAttribute("data-value") || "";
          dropdownButton.textContent = option.textContent || "Todas as categorias";
          closeDropdown();
          blogCategoryFilter.dispatchEvent(new Event("change"));
        });
      });
    }

    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Notícias e Conteúdos da Sants Company</h1>
        <span class="blog-intro-highlight">Curadoria atualizada e análises autorais para decisões digitais melhores.</span>
        <span class="blog-intro-text">Acompanhe notícias de desenvolvimento web, marketing digital, SEO, IA e tecnologia, além dos conteúdos produzidos pela Sants Company.</span>
      </div>
    `;

    const applyFilter = () => {
      const query = normalizeText(blogSearchInput ? blogSearchInput.value : "");
      const selectedCategory = blogCategoryFilter ? blogCategoryFilter.value : "";
      renderPosts(visiblePosts.filter((post) => {
        const matchesTitle = !query || normalizeText(post.title).includes(query);
        const matchesCategory = !selectedCategory || normalizeText(post.category) === normalizeText(selectedCategory);
        return matchesTitle && matchesCategory;
      }), blogList);
    };

    if (blogSearchInput) blogSearchInput.addEventListener("input", applyFilter);
    if (blogCategoryFilter) blogCategoryFilter.addEventListener("change", applyFilter);
    applyFilter();
  })
  .catch((error) => {
    console.error(error);
    renderState(document.getElementById("blogList"), "Não foi possível carregar os conteúdos agora.");
  });
