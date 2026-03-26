fetch("../data/blog/posts.json")
  .then((response) => response.json())
  .then((posts) => {
      posts = posts.filter(post => post.visible !== false);
    const blogList = document.getElementById("blogList");
    const blogWelcome = document.getElementById("blogWelcome");
    if (!blogList || !posts.length || !blogWelcome) return;

    const [featuredPost, ...secondaryPosts] = posts;

    // Bloco de boas-vindas com design aprimorado
    blogWelcome.innerHTML = `
      <div class="blog-intro-desc">
        <h1 class="blog-title">Bem-vindo ao nosso Blog</h1>
        <span class="blog-intro-highlight">Conteúdo de valor para sua evolução digital.</span>
        <span class="blog-intro-text">Acompanhe tendências, estratégias e dicas sobre desenvolvimento web, marketing, SEO, tecnologia e negócios. Inspire-se para transformar resultados e crescer online.</span>
      </div>
    `;

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
        ${secondaryPosts.map((post) => `
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
        `).join("")}
      </div>
    `;
  })
  .catch((error) => {
    console.error(error);
  });
