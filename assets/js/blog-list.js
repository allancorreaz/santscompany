fetch("../data/blog/posts.json")
  .then((response) => response.json())
  .then((posts) => {
    const blogList = document.getElementById("blogList");
    if (!blogList || !posts.length) return;

    const [featuredPost, ...secondaryPosts] = posts;

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
