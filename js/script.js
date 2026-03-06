// =========================
// LOADER
// =========================
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  loader.classList.add("loader-hidden");
});

// =========================
// HERO: animação de entrada (sem typing para preservar destaque no título)
// =========================
document.querySelector(".hero .container")?.classList.add("hero-visible");

// =========================
// MENU MOBILE
// =========================
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector(".nav");

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("active");
});

// =========================
// HEADER SHADOW AO ROLAR
// =========================
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// =========================
// REVEAL AO SCROLL - INSTANTÂNEO
// =========================
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;

  reveals.forEach((el) => {
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 50) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

// =========================
// ANIMAÇÃO DOS CARDS
// =========================
const cards = document.querySelectorAll(".card");

cards.forEach((card) => {

  // Efeito 3D no desktop
  card.addEventListener("mousemove", (e) => {
    if (window.innerWidth > 768) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -(y - centerY) / 15;
      const rotateY = (x - centerX) / 15;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    }
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });

  // Efeito mobile ao clicar
  card.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      card.classList.add("active-mobile");
      setTimeout(() => {
        card.classList.remove("active-mobile");
      }, 400);
    }
  });

});

// =========================
// CONTADOR ANIMADO (só quando a seção entra na tela + sufixo)
// =========================
const counterSection = document.querySelector(".stats-section");
const counters = document.querySelectorAll(".count");
let countersAnimated = false;

function animateCounters() {
  if (!counterSection || countersAnimated) return;
  const rect = counterSection.getBoundingClientRect();
  if (rect.top > window.innerHeight - 150) return;

  countersAnimated = true;
  const suffix = (el) => el.getAttribute("data-suffix") || "";

  counters.forEach((counter) => {
    const target = +counter.getAttribute("data-target");
    const suf = suffix(counter);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(easeOut * target);
      counter.innerHTML = current + (suf ? `<span class="suffix">${suf}</span>` : "");
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  });
}

window.addEventListener("scroll", animateCounters);
animateCounters();

// =========================
// FORMULÁRIO DE CONTATO COM RECAPTCHA - ANTI-SPAM
// =========================
document.querySelector("#contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector("button[type=submit]");
  const originalText = btn.innerHTML;
  
  // Verificar reCAPTCHA ANTES de enviar
  const captchaResponse = grecaptcha.getResponse();
  if (!captchaResponse) {
    btn.innerHTML = '<i class="fas fa-robot"></i> Complete a verificação anti-robô!';
    btn.style.backgroundColor = '#f59e0b';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.backgroundColor = '';
    }, 3000);
    return;
  }
  
  // Mostra loading
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  btn.disabled = true;
  
  try {
    // Preparar dados incluindo captcha
    const formData = new FormData(form);
    formData.append('g-recaptcha-response', captchaResponse);
    
    // Enviar
    const response = await fetch('send.php', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Sucesso
      btn.innerHTML = '<i class="fas fa-check"></i> Enviado! Responderemos em breve.';
      btn.style.backgroundColor = '#22c55e';
      form.reset();
      grecaptcha.reset(); // Reset captcha
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.disabled = false;
      }, 5000);
    } else {
      // Erro
      btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + result.message;
      btn.style.backgroundColor = '#ef4444';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.disabled = false;
      }, 5000);
    }
    
  } catch (error) {
    // Erro de conexão
    btn.innerHTML = '<i class="fas fa-wifi"></i> Sem conexão. Verifique sua internet.';
    btn.style.backgroundColor = '#ef4444';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.backgroundColor = '';
      btn.disabled = false;
    }, 5000);
  }
});

// Manter funcionalidade do formulário antigo se ainda existir
document.querySelector(".contact-form:not(#contactForm)")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> Mensagem enviada!';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;
    e.target.reset();
  }, 2500);
});

// Fechar menu mobile ao clicar em um link
document.querySelectorAll(".nav-link, .nav-cta").forEach((link) => {
  link.addEventListener("click", () => nav?.classList.remove("active"));
});

// =========================
// LOGO: se img/logo.png não carregar, tenta outras extensões (.jpg, .jpeg, .webp)
// =========================
const LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
document.querySelectorAll(".header-logo-img, .footer-logo-img").forEach((img) => {
  img.addEventListener("error", function () {
    const match = this.src.match(/^(.+?)\.(png|jpg|jpeg|webp|svg)(\?.*)?$/i);
    if (!match) return;
    const basePath = match[1];
    const currentExt = (match[2] || "").toLowerCase();
    const nextIdx = LOGO_EXTENSIONS.indexOf(currentExt) + 1;
    if (nextIdx < LOGO_EXTENSIONS.length) this.src = basePath + "." + LOGO_EXTENSIONS[nextIdx];
  });
});

// =========================
// BOTÕES FLUTUANTES - FUNCIONALIDADE MOBILE
// =========================
// Mostrar botões flutuantes apenas em mobile
function toggleFloatingButtons() {
  const floatingButtons = document.querySelector('.floating-buttons');
  if (!floatingButtons) return;
  
  if (window.innerWidth <= 768) {
    floatingButtons.style.display = 'flex';
  } else {
    floatingButtons.style.display = 'none';
  }
}

// Executar na carga e redimensionamento
toggleFloatingButtons();
window.addEventListener('resize', toggleFloatingButtons);

// Adicionar efeito de feedback aos botões flutuantes
document.querySelectorAll('.floating-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // Efeito ripple
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
  });
});

// =========================
// GOOGLE REVIEWS CAROUSEL - INFINITE SCROLL
// =========================
const GoogleReviews = {
  // Configuração - Atualize com seu Place ID do Google
  config: {
    // Para obter o Place ID: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
    placeId: 'YOUR_GOOGLE_PLACE_ID', // Substitua pelo seu Place ID
    googleMapsUrl: 'https://www.google.com/maps/place/Sants+Company', // URL do Google Maps
    maxReviews: 10
  },

  // Reviews estáticos de fallback (quando API não disponível)
  staticReviews: [
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Excelente trabalho! Site profissional e entregue no prazo. A equipe é muito atenciosa e competente. Recomendo para qualquer empresa que precisa de presença digital.",
      profile_photo_url: null,
      relative_time_description: "há 2 semanas"
    },
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Equipe muito profissional. O resultado superou minhas expectativas! O site ficou moderno e rápido. Comunicação excelente durante todo o projeto.",
      profile_photo_url: null,
      relative_time_description: "há 1 mês"
    },
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Atendimento nota 10! Comunicação clara e projeto entregue com qualidade excepcional. Já indiquei para vários amigos empresários.",
      profile_photo_url: null,
      relative_time_description: "há 1 mês"
    },
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Profissionais competentes e éticos. O marketing digital trouxe resultados reais para minha empresa. ROI positivo desde o primeiro mês!",
      profile_photo_url: null,
      relative_time_description: "há 2 meses"
    },
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Site moderno e funcional! A Sants Company entendeu exatamente o que eu precisava. Suporte técnico sempre disponível.",
      profile_photo_url: null,
      relative_time_description: "há 2 meses"
    },
    {
      author_name: "Cliente Verificado",
      rating: 5,
      text: "Trabalho impecável do início ao fim. Prazo cumprido e entrega acima do esperado. Nota fiscal e contrato formal. Super recomendo!",
      profile_photo_url: null,
      relative_time_description: "há 3 meses"
    }
  ],

  // Inicializar
  init() {
    const reviewsTrack = document.getElementById('reviewsTrack');
    const reviewsStatic = document.getElementById('reviewsStatic');
    
    if (!reviewsTrack) return;

    // Tentar carregar reviews via iframe/widget gratuito ou usar fallback
    this.loadReviews();
  },

  // Carregar reviews
  async loadReviews() {
    const reviewsTrack = document.getElementById('reviewsTrack');
    const reviewsStatic = document.getElementById('reviewsStatic');
    
    // Usar reviews estáticos (solução gratuita sem API)
    // Para integração com Google Places API, seria necessário backend com API key
    this.renderStaticReviews(reviewsTrack);
  },

  // Renderizar reviews estáticos com infinite scroll
  renderStaticReviews(container) {
    if (!container) return;

    // Duplicar reviews para criar efeito infinito
    const reviews = [...this.staticReviews, ...this.staticReviews];
    
    container.innerHTML = reviews.map(review => this.createReviewCard(review)).join('');
  },

  // Criar card de review
  createReviewCard(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const starsHtml = Array(review.rating).fill('<i class="fas fa-star"></i>').join('');
    
    const avatarHtml = review.profile_photo_url 
      ? `<img src="${review.profile_photo_url}" alt="${review.author_name}">`
      : `<i class="fas fa-user"></i>`;

    // Truncar texto se muito longo
    const maxLength = 150;
    const truncatedText = review.text.length > maxLength 
      ? review.text.substring(0, maxLength) + '...'
      : review.text;
    const needsReadMore = review.text.length > maxLength;

    return `
      <div class="google-review-card">
        <div class="review-header">
          <div class="reviewer-avatar">
            ${avatarHtml}
          </div>
          <div class="reviewer-info">
            <h4>${review.author_name}</h4>
            <div class="review-rating">
              ${starsHtml}
            </div>
          </div>
          <i class="fab fa-google review-google-icon"></i>
        </div>
        <div class="review-content">
          <p>"${truncatedText}"</p>
        </div>
        ${review.relative_time_description ? `<div class="review-date">${review.relative_time_description}</div>` : ''}
        <a href="${this.config.googleMapsUrl}" target="_blank" class="review-read-more">
          ${needsReadMore ? 'Leia mais no Google' : 'Ver no Google'} <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
    `;
  },

  // Pausar animação ao hover (para mobile touch também)
  setupHoverPause() {
    const tracks = document.querySelectorAll('.reviews-track, .reviews-track-static');
    
    tracks.forEach(track => {
      track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
      });
      
      track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
      });

      // Suporte touch para mobile
      track.addEventListener('touchstart', () => {
        track.style.animationPlayState = 'paused';
      });
      
      track.addEventListener('touchend', () => {
        setTimeout(() => {
          track.style.animationPlayState = 'running';
        }, 2000);
      });
    });
  }
};

// Inicializar Google Reviews quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  GoogleReviews.init();
  GoogleReviews.setupHoverPause();
});

// =========================
// PORTFOLIO IFRAME LOADING
// =========================
// Lazy load para iframes do portfólio
const portfolioIframes = document.querySelectorAll('.portfolio-preview iframe');

if ('IntersectionObserver' in window) {
  const iframeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
        }
        observer.unobserve(iframe);
      }
    });
  }, { rootMargin: '100px' });

  portfolioIframes.forEach(iframe => {
    iframeObserver.observe(iframe);
  });
}