function getPostId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id") || "1";
}

fetch("../data/blog/posts.json")
  .then((response) => response.json())
  .then((posts) => {
    const postId = getPostId();
    const post = posts.find((item) => String(item.id) === postId);
    const postContent = document.getElementById("postContent");
    const relatedPosts = document.getElementById("relatedPosts");

    if (!post || !postContent || !relatedPosts) {
      if (postContent) {
        postContent.innerHTML = '<div class="content-card"><p>Post não encontrado.</p></div>';
      }
      return;
    }

    const postTags = Array.isArray(post.tags) && post.tags.length
      ? post.tags
      : [post.category, "Presença digital", "Captação de clientes"];

    const prioritizedRelatedPosts = posts
      .filter((item) => String(item.id) !== postId && item.visible !== false)
      .sort((a, b) => {
        const aSameCategory = a.category === post.category ? 1 : 0;
        const bSameCategory = b.category === post.category ? 1 : 0;
        return bSameCategory - aSameCategory;
      })
      .slice(0, 3);

    postContent.innerHTML = `
      <div class="blog-post-shell">
        <article class="blog-post-card">
          <img src="${post.banner}" class="blog-hero" alt="${post.title}" decoding="async">
          <div class="blog-post-content">
            <div class="blog-post-header">
              <span class="blog-category-chip">${post.category}</span>
              <div class="blog-post-meta">${post.date} • ${post.readingTime} • por ${post.author}</div>
              <h1 class="blog-post-title">${post.title}</h1>
              <p class="blog-post-intro">${post.summary}</p>
            </div>
            <div class="blog-post-body">${post.content}</div>
            ${post.sources?.length ? `
              <div class="source-list">
                <strong>Fontes recomendadas</strong>
                <ul>
                  ${post.sources.map((source) => `<li><a href="${source}" target="_blank" rel="noopener">${source}</a></li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        </article>

        <aside class="blog-post-sidebar">
          <div class="blog-side-card">
            <h3>Resumo rápido</h3>
            <p>${post.summary}</p>
          </div>
          <div class="blog-side-card">
            <h3>Temas deste artigo</h3>
            <ul>
              ${postTags.map((tag) => `<li>${tag}</li>`).join("")}
            </ul>
          </div>
          <div class="blog-side-card">
            <h3>Quer aplicar isso no seu negócio?</h3>
            <p>Se fizer sentido, fale com a Sants Company e vamos entender qual é o melhor próximo passo para o seu site ou marketing.</p>
            <a href="../pages/contato.html" class="blog-card-readmore">Ir para contato</a>
          </div>
        </aside>
      </div>
    `;

    relatedPosts.innerHTML = prioritizedRelatedPosts
      .map((item) => `
        <a href="./post.html?id=${item.id}" class="blog-card">
          <img src="${item.banner}" alt="${item.title}" class="blog-card-img" loading="lazy" decoding="async">
          <div class="blog-card-content">
            <span class="blog-category-chip">${item.category}</span>
            <div class="blog-card-meta">${item.date} • ${item.readingTime}</div>
            <div class="blog-card-title">${item.title}</div>
            <div class="blog-card-excerpt">${item.summary}</div>
            <span class="blog-card-readmore">Ler mais</span>
          </div>
        </a>
      `)
      .join("");
  })
  .catch((error) => {
    console.error(error);
  });
