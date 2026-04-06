const decodeBuffer = document.createElement("textarea");

function decodeHtmlEntities(text) {
  decodeBuffer.innerHTML = String(text || "");
  return decodeBuffer.value;
}

function normalizeText(text) {
  return decodeHtmlEntities(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function renderPosts(postList, blogList) {
  if (!blogList) return;

  if (!postList.length) {
    blogList.innerHTML = '<div class="content-card"><p>Nenhum post encontrado para os filtros atuais.</p></div>';
    return;
  }

  const [featuredPost, ...secondaryPosts] = postList;

  blogList.innerHTML = `
    <a href="./post.html?id=${featuredPost.id}" class="blog-featured-card">
      <img src="${featuredPost.banner}" alt="${featuredPost.title}" class="blog-featured-img" loading="lazy" decoding="async">
      <div class="blog-featured-content">
        <span class="blog-category-chip">${featuredPost.category}</span>
        <div class="blog-meta">${featuredPost.date} • ${featuredPost.readingTime}</div>
        <h2>${featuredPost.title}</h2>
        <p>${featuredPost.summary}</p>
        <span class="blog-card-readmore">Ler post completo</span>
      </div>
    </a>
    <div class="blog-cards">
      ${secondaryPosts
        .map(
          (post) => `
        <a href="./post.html?id=${post.id}" class="blog-card">
          <img src="${post.banner}" alt="${post.title}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${post.category}</span>
            <div class="blog-card-meta">${post.date} • ${post.readingTime}</div>
            <div class="blog-card-title">${post.title}</div>
            <div class="blog-card-excerpt">${post.summary}</div>
            <span class="blog-card-readmore">Ler mais</span>
          </div>
        </a>
      `
        )
        .join("")}
    </div>
  `;
}

fetch("../data/blog/posts.json")
  .then((response) => response.json())
  .then((posts) => {
    const visiblePosts = posts.filter((post) => post.visible !== false);
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
    const blogSearchInput = document.getElementById("blogSearchInput");
    const blogCategorySelect = document.getElementById("blogCategorySelect");

    if (!blogList || !blogWelcome || !visiblePosts.length) return;

    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Bem-vindo ao nosso Blog</h1>
        <span class="blog-intro-highlight">Conteúdo de valor para sua evolução digital.</span>
        <span class="blog-intro-text">Acompanhe tendências, estratégias e dicas sobre desenvolvimento web, marketing, SEO, tecnologia e negócios. Inspire-se para transformar resultados e crescer online.</span>
      </div>
    `;

    const categories = [...new Set(visiblePosts.map((post) => post.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    if (blogCategorySelect) {
      blogCategorySelect.insertAdjacentHTML(
        "beforeend",
        categories.map((category) => `<option value="${category}">${category}</option>`).join("")
      );
    }

    const applyFilters = () => {
      const query = normalizeText(blogSearchInput ? blogSearchInput.value : "");
      const selectedCategory = blogCategorySelect ? blogCategorySelect.value : "";

      const filteredPosts = visiblePosts.filter((post) => {
        const matchesTitle = !query || normalizeText(post.title).includes(query);
        const matchesCategory = !selectedCategory || post.category === selectedCategory;
        return matchesTitle && matchesCategory;
      });

      renderPosts(filteredPosts, blogList);
    };

    if (blogSearchInput) {
      blogSearchInput.addEventListener("input", applyFilters);
    }

    if (blogCategorySelect) {
      blogCategorySelect.addEventListener("change", applyFilters);
    }

    applyFilters();
  })
  .catch((error) => {
    console.error(error);
  });
