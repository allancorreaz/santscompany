const htmlEntityBuffer = document.createElement("textarea");

function decodeHtmlEntities(text) {
  htmlEntityBuffer.innerHTML = String(text || "");
  return htmlEntityBuffer.value;
}

function normalizeText(text) {
  return decodeHtmlEntities(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function renderPosts(postList, blogList) {
  if (!postList.length) {
    blogList.innerHTML = '<div class="content-card"><p>Nenhum post encontrado para esta busca/categoria.</p></div>';
    return;
  }

  const [featuredPost, ...secondaryPosts] = postList;

  blogList.innerHTML = `
    <a href="${featuredPost.url}" target="_blank" rel="noopener noreferrer" class="blog-featured-card">
      <img src="${featuredPost.banner}" alt="${featuredPost.title}" class="blog-featured-img" loading="lazy" decoding="async">
      <div class="blog-featured-content">
        <span class="blog-category-chip">${decodeHtmlEntities(featuredPost.category)}</span>
        <div class="blog-meta">${featuredPost.date} • ${featuredPost.readingTime}</div>
        <h2>${featuredPost.title}</h2>
        <p>${featuredPost.summary}</p>
        <span class="blog-card-readmore">Ler notícia completa <i class="fas fa-external-link-alt"></i></span>
      </div>
    </a>
    <div class="blog-cards">
      ${secondaryPosts.map((post) => `
        <a href="${post.url}" target="_blank" rel="noopener noreferrer" class="blog-card">
          <img src="${post.banner}" alt="${post.title}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${decodeHtmlEntities(post.category)}</span>
            <div class="blog-card-meta">${post.date} • ${post.readingTime}</div>
            <div class="blog-card-title">${post.title}</div>
            <div class="blog-card-excerpt">${post.summary}</div>
            <span class="blog-card-readmore">Ler mais <i class="fas fa-external-link-alt"></i></span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

// Feeds RSS com foco em Tecnologia, SEO, Marketing Digital e Dev
const RSS_SOURCES = [
  { url: 'https://tecnoblog.net/feed/', defaultCategory: 'Tecnologia' },
  { url: 'https://canaltech.com.br/rss/', defaultCategory: 'Desenvolvimento & Tech' }
];

async function loadRSSPosts() {
  const allItems = [];

  for (const source of RSS_SOURCES) {
    try {
      const apiEndpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (data.status === 'ok') {
        const mappedItems = data.items.map((item, index) => {
          // Extrai imagem do HTML se a thumbnail não vier no JSON
          const imgMatch = item.content ? item.content.match(/<img[^>]+src="([^">]+)"/) : null;
          const banner = item.thumbnail || (imgMatch ? imgMatch[1] : '../assets/images/blog-default.jpg');
          
          // Resumo limpo sem tags HTML
          const cleanSummary = item.description.replace(/<[^>]*>?/gm, '').substring(0, 130) + '...';

          return {
            id: `rss-${index}-${Date.now()}`,
            url: item.link,
            title: item.title,
            category: item.categories && item.categories.length ? item.categories[0] : source.defaultCategory,
            banner: banner,
            date: new Date(item.pubDate).toLocaleDateString('pt-BR'),
            readingTime: '3 min de leitura',
            summary: cleanSummary
          };
        });
        allItems.push(...mappedItems);
      }
    } catch (err) {
      console.error('Erro ao carregar RSS:', err);
    }
  }

  return allItems;
}

// Inicialização e vinculação com os componentes existentes
loadRSSPosts().then((visiblePosts) => {
  const blogList = document.getElementById("blogList");
  const blogWelcome = document.getElementById("blogWelcome");
  const blogSearchInput = document.getElementById("blogSearchInput");
  const blogCategoryFilter = document.getElementById("blogCategoryFilter");

  if (!blogList || !visiblePosts.length) return;

  const categories = [...new Set(visiblePosts.map((post) => decodeHtmlEntities(post.category)))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  if (blogCategoryFilter) {
    blogCategoryFilter.insertAdjacentHTML(
      "beforeend",
      categories.map((category) => `<option value="${category}">${category}</option>`).join("")
    );
    
    // MANTÉM O SEU DROPDOWN CUSTOMIZADO INTACTO
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
      ...categories.map((category) => `<div class="custom-dropdown-option" data-value="${category}">${category}</div>`)
    ].join("");
    
    dropdownMenu.innerHTML = optionsHtml;
    customDropdown.appendChild(dropdownButton);
    customDropdown.appendChild(dropdownMenu);
    
    filterFieldLabel.appendChild(customDropdown);
    blogCategoryFilter.style.display = "none";
    
    let isOpen = false;
    const openDropdown = () => { isOpen = true; customDropdown.classList.add("open"); };
    const closeDropdown = () => { isOpen = false; customDropdown.classList.remove("open"); };
    
    dropdownButton.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen ? closeDropdown() : openDropdown();
    });
    
    customDropdown.addEventListener("mouseenter", openDropdown);
    customDropdown.addEventListener("mouseleave", closeDropdown);
    
    document.addEventListener("click", (e) => {
      if (!customDropdown.contains(e.target)) closeDropdown();
    });
    
    const options = dropdownMenu.querySelectorAll(".custom-dropdown-option");
    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        const text = option.textContent;
        blogCategoryFilter.value = value;
        dropdownButton.textContent = text;
        closeDropdown();
        blogCategoryFilter.dispatchEvent(new Event("change"));
      });
    });
  }

  if (blogWelcome && !blogWelcome.innerHTML.trim()) {
    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Bem-vindo ao nosso Blog</h1>
        <span class="blog-intro-highlight">Conteúdo de valor para sua evolução digital.</span>
        <span class="blog-intro-text">Acompanhe tendências, estratégias e dicas sobre desenvolvimento web, marketing, SEO, tecnologia e negócios. Inspire-se para transformar resultados e crescer online.</span>
      </div>
    `;
  }

  const applyFilter = () => {
    const query = normalizeText(blogSearchInput ? blogSearchInput.value : "");
    const selectedCategory = blogCategoryFilter ? blogCategoryFilter.value : "";

    const filteredPosts = visiblePosts.filter((post) => {
      const matchesTitle = !query || normalizeText(post.title).includes(query);
      const matchesCategory =
        !selectedCategory || normalizeText(post.category) === normalizeText(selectedCategory);

      return matchesTitle && matchesCategory;
    });

    renderPosts(filteredPosts, blogList);
  };

  if (blogSearchInput) blogSearchInput.addEventListener("input", applyFilter);
  if (blogCategoryFilter) blogCategoryFilter.addEventListener("change", applyFilter);

  applyFilter();
});