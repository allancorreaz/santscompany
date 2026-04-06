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
    <a href="./post.html?id=${featuredPost.id}" class="blog-featured-card">
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
        <a href="./post.html?id=${post.id}" class="blog-card">
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

fetch("../data/blog/posts.json")
  .then((response) => response.json())
  .then((posts) => {
    const visiblePosts = posts.filter((post) => post.visible !== false);
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
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
    }

    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Bem-vindo ao nosso Blog</h1>
        <span class="blog-intro-highlight">Conteúdo de valor para sua evolução digital.</span>
        <span class="blog-intro-text">Acompanhe tendências, estratégias e dicas sobre desenvolvimento web, marketing, SEO, tecnologia e negócios. Inspire-se para transformar resultados e crescer online.</span>
      </div>
    `;

    const applyFilter = () => {
      const selectedCategory = blogCategoryFilter ? blogCategoryFilter.value : "";

      const filteredPosts = visiblePosts.filter((post) => {
        if (!selectedCategory) return true;
        return normalizeText(post.category) === normalizeText(selectedCategory);
      });

      renderPosts(filteredPosts, blogList);
    };

    if (blogCategoryFilter) {
      blogCategoryFilter.addEventListener("change", applyFilter);
    }

    applyFilter();
  })
  .catch((error) => {
    console.error(error);
  });
