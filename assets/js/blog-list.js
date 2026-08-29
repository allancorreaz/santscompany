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

function renderState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="blog-empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function renderPosts(postList, blogList) {
  if (!postList.length) {
    renderState(blogList, "Nenhuma notícia encontrada para esta busca ou categoria.");
    return;
  }

  const [featuredPost, ...secondaryPosts] = postList;

  blogList.innerHTML = `
    <a href="${sanitizeUrl(featuredPost.url)}" target="_blank" rel="noopener noreferrer" class="blog-featured-card">
      <img src="${sanitizeUrl(featuredPost.banner, "../assets/images/branding/logo.png")}" alt="${escapeHtml(featuredPost.title)}" class="blog-featured-img" loading="lazy" decoding="async">
      <div class="blog-featured-content">
        <span class="blog-category-chip">${escapeHtml(decodeHtmlEntities(featuredPost.category))}</span>
        <div class="blog-meta">${escapeHtml(featuredPost.date)} • ${escapeHtml(featuredPost.readingTime)} • Fonte: ${escapeHtml(featuredPost.sourceName)}</div>
        <h2>${escapeHtml(featuredPost.title)}</h2>
        <p>${escapeHtml(featuredPost.summary)}</p>
        <span class="blog-card-readmore">Ler notícia completa <i class="fas fa-external-link-alt"></i></span>
      </div>
    </a>
    <div class="blog-cards">
      ${secondaryPosts.map((post) => `
        <a href="${sanitizeUrl(post.url)}" target="_blank" rel="noopener noreferrer" class="blog-card">
          <img src="${sanitizeUrl(post.banner, "../assets/images/branding/logo.png")}" alt="${escapeHtml(post.title)}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${escapeHtml(decodeHtmlEntities(post.category))}</span>
            <div class="blog-card-meta">${escapeHtml(post.date)} • ${escapeHtml(post.readingTime)} • Fonte: ${escapeHtml(post.sourceName)}</div>
            <div class="blog-card-title">${escapeHtml(post.title)}</div>
            <div class="blog-card-excerpt">${escapeHtml(post.summary)}</div>
            <span class="blog-card-readmore">Ler mais <i class="fas fa-external-link-alt"></i></span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

function renderOwnArticles(posts, container) {
  if (!container) return;

  if (!posts.length) {
    renderState(container, "Nenhum artigo institucional disponível no momento.");
    return;
  }

  container.innerHTML = posts.map((post) => `
    <a href="./posts/${encodeURIComponent(post.id)}.html" class="blog-card">
      <img src="${sanitizeUrl(post.banner, "../assets/images/branding/logo.png")}" alt="${escapeHtml(decodeHtmlEntities(post.title))}" class="blog-card-img" loading="lazy" decoding="async">
      <div class="blog-card-content">
        <span class="blog-category-chip">${escapeHtml(decodeHtmlEntities(post.category))}</span>
        <div class="blog-card-meta">${escapeHtml(post.date)} • ${escapeHtml(post.readingTime)} • ${escapeHtml(post.author)}</div>
        <div class="blog-card-title">${escapeHtml(decodeHtmlEntities(post.title))}</div>
        <div class="blog-card-excerpt">${escapeHtml(decodeHtmlEntities(post.summary))}</div>
        <span class="blog-card-readmore">Ler artigo completo</span>
      </div>
    </a>
  `).join("");
}

const blogAssetVersion = window.SANTS_CONFIG && window.SANTS_CONFIG.assetVersion
  ? String(window.SANTS_CONFIG.assetVersion)
  : "";

const blogNewsUrl = blogAssetVersion
  ? `../data/blog/news.json?v=${encodeURIComponent(blogAssetVersion)}`
  : "../data/blog/news.json";

const blogOwnPostsUrl = blogAssetVersion
  ? `../data/blog/posts.json?v=${encodeURIComponent(blogAssetVersion)}`
  : "../data/blog/posts.json";

fetch(blogNewsUrl, { cache: "no-store" })
  .then((response) => response.json())
  .then((newsItems) => {
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
    const blogSearchInput = document.getElementById("blogSearchInput");
    const blogCategoryFilter = document.getElementById("blogCategoryFilter");

    if (!blogList || !blogWelcome) return;

    const visiblePosts = Array.isArray(newsItems) ? newsItems.map((item) => ({
      id: item.id,
      url: sanitizeUrl(item.url),
      title: decodeHtmlEntities(item.title),
      category: decodeHtmlEntities(item.category),
      banner: sanitizeUrl(item.banner, "../assets/images/branding/logo.png"),
      date: item.date,
      readingTime: item.readingTime,
      summary: decodeHtmlEntities(item.summary),
      sourceName: decodeHtmlEntities(item.sourceName)
    })) : [];

    if (!visiblePosts.length) {
      renderState(blogList, "As notícias ainda estão sendo preparadas. Tente novamente em alguns minutos.");
      return;
    }

    const categories = [...new Set(visiblePosts.map((post) => decodeHtmlEntities(post.category)))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    if (blogCategoryFilter && !blogCategoryFilter.dataset.enhanced) {
      blogCategoryFilter.insertAdjacentHTML(
        "beforeend",
        categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")
      );

      const filterFieldLabel = blogCategoryFilter.closest(".blog-filter-field");
      const customDropdown = document.createElement("div");
      customDropdown.className = "custom-dropdown";

      const dropdownButton = document.createElement("button");
      dropdownButton.className = "custom-dropdown-button";
      dropdownButton.textContent = "Todas as categorias";
      dropdownButton.type = "button";

      const dropdownMenu = document.createElement("div");
      dropdownMenu.className = "custom-dropdown-menu";

      const optionsHtml = [
        '<div class="custom-dropdown-option" data-value="">Todas as categorias</div>',
        ...categories.map((category) => `<div class="custom-dropdown-option" data-value="${escapeHtml(category)}">${escapeHtml(category)}</div>`)
      ].join("");

      dropdownMenu.innerHTML = optionsHtml;
      customDropdown.appendChild(dropdownButton);
      customDropdown.appendChild(dropdownMenu);

      if (filterFieldLabel) {
        filterFieldLabel.appendChild(customDropdown);
      }
      blogCategoryFilter.style.display = "none";
      blogCategoryFilter.dataset.enhanced = "true";

      let isOpen = false;

      const openDropdown = () => {
        isOpen = true;
        customDropdown.classList.add("open");
      };

      const closeDropdown = () => {
        isOpen = false;
        customDropdown.classList.remove("open");
      };

      dropdownButton.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen ? closeDropdown() : openDropdown();
      });

      customDropdown.addEventListener("mouseenter", openDropdown);
      customDropdown.addEventListener("mouseleave", closeDropdown);

      document.addEventListener("click", (e) => {
        if (!customDropdown.contains(e.target)) {
          closeDropdown();
        }
      });

      const options = dropdownMenu.querySelectorAll(".custom-dropdown-option");
      options.forEach((option) => {
        option.addEventListener("click", () => {
          const value = option.getAttribute("data-value") || "";
          const text = option.textContent || "Todas as categorias";

          blogCategoryFilter.value = value;
          dropdownButton.textContent = text;
          closeDropdown();
          blogCategoryFilter.dispatchEvent(new Event("change"));
        });
      });
    }

    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Notícias de Tecnologia e Marketing</h1>
        <span class="blog-intro-highlight">Curadoria diária das principais fontes do setor.</span>
        <span class="blog-intro-text">Acompanhe as últimas notícias sobre desenvolvimento web, marketing digital, SEO, IA e tecnologia, direto de fontes como Google, HubSpot, AWS e GitHub.</span>
      </div>
    `;

    const applyFilter = () => {
      const query = normalizeText(blogSearchInput ? blogSearchInput.value : "");
      const selectedCategory = blogCategoryFilter ? blogCategoryFilter.value : "";

      const filteredPosts = visiblePosts.filter((post) => {
        const matchesTitle = !query || normalizeText(post.title).includes(query);
        const matchesCategory = !selectedCategory || normalizeText(post.category) === normalizeText(selectedCategory);
        return matchesTitle && matchesCategory;
      });

      renderPosts(filteredPosts, blogList);
    };

    if (blogSearchInput) {
      blogSearchInput.addEventListener("input", applyFilter);
    }

    if (blogCategoryFilter) {
      blogCategoryFilter.addEventListener("change", applyFilter);
    }

    applyFilter();
  })
  .catch((error) => {
    console.error(error);
    renderState(document.getElementById("blogList"), "Não foi possível carregar as notícias agora.");
  });

fetch(blogOwnPostsUrl, { cache: "no-store" })
  .then((response) => response.json())
  .then((posts) => {
    const visibleOwnPosts = (Array.isArray(posts) ? posts : [])
      .filter((post) => post.visible !== false)
      .map((post) => ({
        id: post.id,
        title: decodeHtmlEntities(post.title),
        banner: post.banner,
        author: post.author,
        date: post.date,
        category: post.category,
        readingTime: post.readingTime,
        summary: decodeHtmlEntities(post.summary)
      }))
      .sort((a, b) => parsePtBrDate(b.date) - parsePtBrDate(a.date));

    const ownArticlesList = document.getElementById("ownArticlesList");
    renderOwnArticles(visibleOwnPosts, ownArticlesList);
  })
  .catch((error) => {
    console.error(error);
    renderState(document.getElementById("ownArticlesList"), "Não foi possível carregar os artigos da Sants Company agora.");
  });
