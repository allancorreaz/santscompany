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
// REVEAL AO SCROLL COM DELAY
// =========================
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;

  reveals.forEach((el, index) => {
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 50) {
      setTimeout(() => {
        el.classList.add("active");
      }, index * 20); // Reduzido para 20ms para animações muito mais rápidas
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
// FORMULÁRIO DE CONTATO COM HCAPTCHA - ANTI-SPAM
// =========================
document.querySelector("#contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector("button[type=submit]");
  const originalText = btn.innerHTML;
  
  // Verificar hCaptcha ANTES de enviar
  const captchaResponse = hcaptcha.getResponse();
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
    formData.append('h-captcha-response', captchaResponse);
    
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
      hcaptcha.reset(); // Reset captcha
      
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