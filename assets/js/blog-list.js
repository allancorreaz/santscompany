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
    blogList.innerHTML = '<div class="content-card"><p>Nenhum post encontrado para esta categoria.</p></div>';
    return;
  }

  const [featuredPost, ...secondaryPosts] = postList;

  blogList.innerHTML = `
    <a href="./posts/${featuredPost.id}.html" class="blog-featured-card">
      <img src="${featuredPost.banner}" alt="${featuredPost.title}" class="blog-featured-img" loading="lazy" decoding="async">
      <div class="blog-featured-content">
        <span class="blog-category-chip">${decodeHtmlEntities(featuredPost.category)}</span>
        <div class="blog-meta">${featuredPost.date} • ${featuredPost.readingTime}</div>
        <h2>${featuredPost.title}</h2>
        <p>${featuredPost.summary}</p>
        <span class="blog-card-readmore">Ler post completo</span>
      </div>
    </a>
    <div class="blog-cards">
      ${secondaryPosts.map((post) => `
        <a href="./posts/${post.id}.html" class="blog-card">
          <img src="${post.banner}" alt="${post.title}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${decodeHtmlEntities(post.category)}</span>
            <div class="blog-card-meta">${post.date} • ${post.readingTime}</div>
            <div class="blog-card-title">${post.title}</div>
            <div class="blog-card-excerpt">${post.summary}</div>
            <span class="blog-card-readmore">Ler mais</span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

const blogAssetVersion = window.SANTS_CONFIG && window.SANTS_CONFIG.assetVersion
  ? String(window.SANTS_CONFIG.assetVersion)
  : "";
const blogPostsUrl = blogAssetVersion
  ? `../data/blog/posts.json?v=${encodeURIComponent(blogAssetVersion)}`
  : "../data/blog/posts.json";

fetch(blogPostsUrl, { cache: "no-store" })
  .then((response) => response.json())
  .then((posts) => {
    const visiblePosts = posts.filter((post) => post.visible !== false);
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
    const blogSearchInput = document.getElementById("blogSearchInput");
    const blogCategoryFilter = document.getElementById("blogCategoryFilter");

    if (!blogList || !blogWelcome || !visiblePosts.length) return;

    const categories = [...new Set(visiblePosts.map((post) => decodeHtmlEntities(post.category)))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    if (blogCategoryFilter) {
      blogCategoryFilter.insertAdjacentHTML(
        "beforeend",
        categories.map((category) => `<option value="${category}">${category}</option>`).join("")
      );
      
      // Criar dropdown customizado
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
      
      // Inserir dropdown customizado e esconder select nativo
      filterFieldLabel.appendChild(customDropdown);
      blogCategoryFilter.style.display = "none";
      
      // Gerenciar abertura/fechamento
      let isOpen = false;
      
      const openDropdown = () => {
        isOpen = true;
        customDropdown.classList.add("open");
      };
      
      const closeDropdown = () => {
        isOpen = false;
        customDropdown.classList.remove("open");
      };
      
      // Abrir/fechar com clique
      dropdownButton.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen ? closeDropdown() : openDropdown();
      });
      
      // Abrir/fechar com hover
      customDropdown.addEventListener("mouseenter", openDropdown);
      customDropdown.addEventListener("mouseleave", closeDropdown);
      
      // Fechar ao clicar fora
      document.addEventListener("click", (e) => {
        if (!customDropdown.contains(e.target)) {
          closeDropdown();
        }
      });
      
      // Gerenciar seleção de opções
      const options = dropdownMenu.querySelectorAll(".custom-dropdown-option");
      options.forEach((option) => {
        option.addEventListener("click", () => {
          const value = option.getAttribute("data-value");
          const text = option.textContent;
          
          blogCategoryFilter.value = value;
          dropdownButton.textContent = text;
          
          isOpen = false;
          customDropdown.classList.remove("open");
          
          // Trigger change event
          blogCategoryFilter.dispatchEvent(new Event("change"));
        });
      });
    }

    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Bem-vindo ao nosso Blog</h1>
        <span class="blog-intro-highlight">Conteúdo de valor para sua evolução digital.</span>
        <span class="blog-intro-text">Acompanhe tendências, estratégias e dicas sobre desenvolvimento web, marketing, SEO, tecnologia e negócios. Inspire-se para transformar resultados e crescer online.</span>
      </div>
    `;

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
  });
