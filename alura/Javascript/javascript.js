// ================= CONFIG =================
const CONFIG = {
  API_KEY: "7ef74028ffed68ca7b35e0f0cf63c805",
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_URL: "https://image.tmdb.org/t/p/w300",
  YOUTUBE_EMBED_URL: "https://www.youtube.com/embed/"
};

// ================= UTIL =================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ================= TOAST =================
function mostrarToast(msg, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ================= LOADING =================
function mostrarLoading(id = "catalogo", count = 10) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = "";
  el.classList.add("loading-skeletons");

  for (let i = 0; i < count; i++) {
    const skeletonCard = document.createElement("div");
    skeletonCard.className = "card skeleton-card";
    skeletonCard.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="card-info">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-buttons"></div>
        <div class="skeleton skeleton-rating"></div>
      </div>
    `;
    el.appendChild(skeletonCard);
  }
}

// ================= CACHE =================
const CACHE_TIME = 1000 * 60 * 30; // 30 minutos

async function fetchAPI(url) {
  try {
    const key = "cache_" + url;
    const cache = localStorage.getItem(key);

    if (cache) {
      const { data, time } = JSON.parse(cache);
      if (Date.now() - time < CACHE_TIME) {
        return data;
      }
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro na API: ${res.statusText}`);

    const data = await res.json();

    localStorage.setItem(key, JSON.stringify({
      data,
      time: Date.now()
    }));

    return data;
  } catch (err) {
    console.error(err);
    mostrarToast("Erro ao buscar dados", "error");
    return null;
  }
}

// ================= AUTH & PERFIL =================
function logout() {
  localStorage.clear();
  window.location.href = "/paginas/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== NAVBAR DROPDOWN =====
  const avatarButton = $("#avatarUsuario");
  const dropdownEl = $("#dropdown");
  const dropdownItems = $$(".dropdown-item");

  if (avatarButton && dropdownEl) {
    avatarButton.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownEl.classList.toggle("active");
    });

    // Close dropdown when clicking on an item
    dropdownItems.forEach(item => {
      item.addEventListener("click", () => {
        dropdownEl.classList.remove("active");
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdownEl.contains(e.target) && !avatarButton.contains(e.target)) {
        dropdownEl.classList.remove("active");
      }
    });
  }

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = $(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }
  });

  // ===== NAV MENU (Category buttons) =====
  const navLinks = $$(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const categoria = link.dataset.categoria;
      if (categoria) carregarCategoria(categoria);
    });
  });

  // ===== SEARCH FUNCTIONALITY =====
  const searchIcon = $("#searchIcon");
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");

  if (searchIcon && searchInput) {
    searchIcon.addEventListener("click", () => {
      searchInput.focus();
    });

    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      if (query.length > 2) {
        await buscarFilmes(query, searchResults);
      } else {
        searchResults.innerHTML = "";
      }
    });

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.innerHTML = "";
      }
    });
  }

  // ===== LOGOUT =====
  const logoutLink = $(".logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});

// ================= FILMES / SÉRIES =================
let pagina = 1;
let carregando = false;

async function carregarFilmes(tipo = "movie", categoria = "popular", limpar = true, seletor = "#catalogo") {
  if (limpar) mostrarLoading(seletor.replace("#", ""));

  const data = await fetchAPI(
    `${CONFIG.BASE_URL}/${tipo}/${categoria}?api_key=${CONFIG.API_KEY}&language=pt-BR&page=${pagina}`
  );

  if (data && data.results) {
    renderFilmes(data.results, limpar, seletor);
  }
}

async function carregarSeries(categoria = "popular", limpar = true, seletor = "#catalogo-series") {
  await carregarFilmes("tv", categoria, limpar, seletor);
}

function carregarCategoria(categoria) {
  mostrarToast(`Carregando categoria: ${categoria}`, "info");
}

function mostrarMinhaLista() {
  mostrarToast("Exibindo Minha Lista", "info");
}

// ================= RENDER FILMES =================
function renderFilmes(lista, limpar = true, seletor = "#catalogo") {
  const container = $(seletor);
  if (!container || !lista) return;

  if (limpar) container.innerHTML = "";

  lista.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.filmeId = item.id;
    card.dataset.filme = JSON.stringify(item);
    card.style.animation = `fadeInScale 0.5s ease-out ${index * 0.05}s backwards`;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.poster_path ? CONFIG.IMG_URL + item.poster_path : "/assets/img/placeholder.png";
    img.alt = item.title || item.name;

    const info = document.createElement("div");
    info.className = "card-info";
    info.innerHTML = `
      <h4>${item.title || item.name}</h4>
      <div class="card-buttons">
        <button class="play" aria-label="Assistir">▶</button>
        <button class="add" aria-label="Adicionar à lista">＋</button>
      </div>
      <div class="rating">⭐ ${item.vote_average?.toFixed(1) || "N/A"}</div>
    `;

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

// ================= MINHA LISTA =================
function addMinhaLista(item) {
  let lista = JSON.parse(localStorage.getItem("lista")) || [];
  const existe = lista.find(f => f.id === item.id);

  if (existe) {
    lista = lista.filter(f => f.id !== item.id);
    mostrarToast("Removido da lista", "error");
  } else {
    lista.push(item);
    mostrarToast("Adicionado à lista");
  }

  localStorage.setItem("lista", JSON.stringify(lista));
}

function abrirFilme(item) {
  localStorage.setItem("filme", JSON.stringify(item));
  window.location.href = "/paginas/detalhes.html";
}

// ================= BUSCA =================
let timeoutBusca;
const searchResultsEl = $("#searchResults");

function buscarFilmes(q) {
  clearTimeout(timeoutBusca);
  if (!searchResultsEl) return;

  if (q.length < 3) {
    searchResultsEl.style.display = "none";
    return;
  }

  timeoutBusca = setTimeout(async () => {
    const data = await fetchAPI(
      `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&language=pt-BR&query=${q}`
    );

    if (data?.results?.length > 0) {
      searchResultsEl.innerHTML = data.results.slice(0, 5).map(f => {
        const poster = f.poster_path ? CONFIG.IMG_URL + f.poster_path : "/assets/img/placeholder.png";
        return `
          <div class="search-item" data-filme='${JSON.stringify(f)}'>
            <img src="${poster}" alt="${f.title}">
            <span>${f.title}</span>
          </div>
        `;
      }).join("");
      searchResultsEl.style.display = "block";
    } else {
      searchResultsEl.innerHTML = `<div style="padding:10px; text-align:center;">Nenhum resultado encontrado.</div>`;
      searchResultsEl.style.display = "block";
    }
  }, 300);
}

// ================= SCROLL =================
function scrollRow(direction, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scrollAmount = container.clientWidth * 0.6;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;

  // Calcular novo scroll
  let newScroll = currentScroll + (direction * scrollAmount);

  // Limitar ao range válido
  newScroll = Math.max(0, Math.min(newScroll, maxScroll));

  // Scroll com easing suave
  container.scrollBy({
    left: newScroll - currentScroll,
    behavior: "smooth"
  });

  // Feedback visual - desabilitar botões se estiver no limite
  updateScrollButtons(containerId);
}

function updateScrollButtons(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const buttons = document.querySelectorAll(`[data-scroll-target="${containerId}"]`);
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;

  buttons.forEach(btn => {
    if (btn.classList.contains("left")) {
      btn.style.opacity = currentScroll <= 0 ? "0.3" : "0.7";
      btn.style.pointerEvents = currentScroll <= 0 ? "none" : "auto";
    } else if (btn.classList.contains("right")) {
      btn.style.opacity = currentScroll >= maxScroll ? "0.3" : "0.7";
      btn.style.pointerEvents = currentScroll >= maxScroll ? "none" : "auto";
    }
  });
}

function scrollCategorias(direction) {
  const catContainer = $("#categorias-container");
  if (!catContainer) return;

  const scrollAmount = catContainer.clientWidth * 0.6;
  const maxScroll = catContainer.scrollWidth - catContainer.clientWidth;
  const currentScroll = catContainer.scrollLeft;

  // Calcular novo scroll
  let newScroll = currentScroll + (direction * scrollAmount);

  // Limitar ao range válido
  newScroll = Math.max(0, Math.min(newScroll, maxScroll));

  // Scroll com easing suave
  catContainer.scrollBy({
    left: newScroll - currentScroll,
    behavior: "smooth"
  });

  // Feedback visual - desabilitar botões se estiver no limite
  updateCategoriaScrollButtons();
}

function updateCategoriaScrollButtons() {
  const catContainer = $("#categorias-container");
  if (!catContainer) return;

  const leftBtn = document.querySelector(".cat-scroll.left");
  const rightBtn = document.querySelector(".cat-scroll.right");
  const maxScroll = catContainer.scrollWidth - catContainer.clientWidth;
  const currentScroll = catContainer.scrollLeft;

  if (leftBtn) {
    leftBtn.style.opacity = currentScroll <= 0 ? "0.3" : "0.7";
    leftBtn.style.pointerEvents = currentScroll <= 0 ? "none" : "auto";
  }

  if (rightBtn) {
    rightBtn.style.opacity = currentScroll >= maxScroll ? "0.3" : "0.7";
    rightBtn.style.pointerEvents = currentScroll >= maxScroll ? "none" : "auto";
  }
}

// ================= HERO CAROUSEL - FULL SCREEN MODERNO =================
let currentHeroIndex = 0;
let heroMovies = [];
let heroAutoplayInterval = null;

async function inicializarHeroCarousel() {
  const heroBg = $("#heroCarouselBg");
  const heroIndicators = $("#heroIndicators");

  if (!heroBg || !heroIndicators) return;

  // Carregar filmes populares
  const data = await fetchAPI(`${CONFIG.BASE_URL}/movie/popular?api_key=${CONFIG.API_KEY}&language=pt-BR&page=1`);

  if (data?.results) {
    heroMovies = data.results.slice(0, 8).map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      rating: movie.vote_average,
      releaseYear: new Date(movie.release_date).getFullYear()
    }));

    if (heroMovies.length > 0) {
      renderHeroCarousel();
      setupHeroControls();
      iniciarAutoplayHero();
    }
  }
}

function renderHeroCarousel() {
  const heroBg = $("#heroCarouselBg");
  const heroIndicators = $("#heroIndicators");
  const current = heroMovies[currentHeroIndex];

  if (!current) return;

  // Background image
  const backdropUrl = CONFIG.IMG_URL.replace("w300", "w1280") + current.backdropPath;
  heroBg.style.backgroundImage = `url('${backdropUrl}')`;

  // Atualizar conteúdo
  $("#heroTitle").innerText = current.title || "";
  $("#heroOverview").innerText = current.overview || "Sem sinopse disponível...";
  $("#heroPoster").src = CONFIG.IMG_URL + current.posterPath;
  $("#heroPoster").alt = current.title;
  $("#heroRatingValue").innerText = current.rating?.toFixed(1) || "N/A";
  $("#heroYear").innerText = current.releaseYear || "---";

  // Atualizar indicadores
  heroIndicators.innerHTML = "";
  heroMovies.forEach((_, index) => {
    const indicator = document.createElement("div");
    indicator.className = `hero-indicator ${index === currentHeroIndex ? "active" : ""}`;
    indicator.role = "tab";
    indicator.setAttribute("aria-selected", index === currentHeroIndex);
    indicator.onclick = () => goToHeroSlide(index);
    heroIndicators.appendChild(indicator);
  });

  // Reiniciar barra de progresso
  const progressBar = $("#heroProgressBar");
  if (progressBar) {
    progressBar.style.animation = "none";
    setTimeout(() => {
      progressBar.style.animation = "heroProgress 8s linear forwards";
    }, 10);
  }
}

function setupHeroControls() {
  const prevBtn = $("#heroPrev");
  const nextBtn = $("#heroNext");
  const playBtn = $("#heroBtnPlay");
  const listBtn = $("#heroBtnList");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentHeroIndex = (currentHeroIndex - 1 + heroMovies.length) % heroMovies.length;
      renderHeroCarousel();
      reiniciarAutoplayHero();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
      renderHeroCarousel();
      reiniciarAutoplayHero();
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      const filme = heroMovies[currentHeroIndex];
      if (filme) {
        localStorage.setItem("filme", JSON.stringify(filme));
        window.location.href = "/paginas/detalhes.html";
      }
    });
  }

  if (listBtn) {
    listBtn.addEventListener("click", () => {
      mostrarToast("Adicionado à lista!", "success");
    });
  }
}

function goToHeroSlide(index) {
  if (index === currentHeroIndex) return;
  currentHeroIndex = index;
  renderHeroCarousel();
  reiniciarAutoplayHero();
}

function iniciarAutoplayHero() {
  if (heroAutoplayInterval) clearInterval(heroAutoplayInterval);
  
  heroAutoplayInterval = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
    renderHeroCarousel();
  }, 8000);
}

function reiniciarAutoplayHero() {
  if (heroAutoplayInterval) clearInterval(heroAutoplayInterval);
  iniciarAutoplayHero();
}

function pausarAutoplayHero() {
  if (heroAutoplayInterval) clearInterval(heroAutoplayInterval);
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  limparCacheAntigo();

  carregarFilmes("movie", "popular", true, "#catalogo");
  carregarSeries("popular", true, "#catalogo-series");

  // Inicializar estado dos botões de scroll
  setTimeout(() => {
    updateScrollButtons("catalogo");
    updateScrollButtons("catalogo-series");
    updateCategoriaScrollButtons();
  }, 300);

  // Monitor scroll para atualizar estado dos botões
  const catalogo = document.getElementById("catalogo");
  const catalogoSeries = document.getElementById("catalogo-series");
  const categorias = document.getElementById("categorias-container");

  if (catalogo) {
    catalogo.addEventListener("scroll", () => updateScrollButtons("catalogo"));
  }
  if (catalogoSeries) {
    catalogoSeries.addEventListener("scroll", () => updateScrollButtons("catalogo-series"));
  }
  if (categorias) {
    categorias.addEventListener("scroll", updateCategoriaScrollButtons);
  }

  // Inicializar Hero Carousel
  inicializarHeroCarousel();
});

// Função auxiliar para limpar cache (caso não tenha)
function limparCacheAntigo() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("cache_")) {
      try {
        const { time } = JSON.parse(localStorage.getItem(key));
        if (Date.now() - time > CACHE_TIME) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  });
}

// ================= EVENT LISTENERS =================
// Avatar menu toggle
const avatarButton = $("#avatarUsuario");
if (avatarButton) {
  avatarButton.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMenu();
    // Atualizar aria-expanded
    const isExpanded = avatarButton.getAttribute("aria-expanded") === "true";
    avatarButton.setAttribute("aria-expanded", !isExpanded);
  });
}

// Navigation menu
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const categoria = btn.dataset.categoria;
    if (categoria === "minhaLista") {
      mostrarMinhaLista();
    } else {
      carregarCategoria(categoria);
    }
  });
});

// Search input
const searchInput = $("#searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function(e) {
    // Aqui você pode adicionar lógica de busca em tempo real
    // Por exemplo, chamar uma função buscar() se existir
  });
}

// Logout link
const logoutLinks = document.querySelectorAll(".logout-link");
logoutLinks[logoutLinks.length - 1]?.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

// Mute toggle button
const muteButton = $("#muteToggleButton");
if (muteButton) {
  muteButton.addEventListener("click", toggleMute);
}

// Banner play button
const playButton = $("#bannerPlayButton");
if (playButton) {
  playButton.addEventListener("click", assistirBanner);
}

// Carousel scroll buttons
document.querySelectorAll(".scroll-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const direction = btn.classList.contains("left") ? -1 : 1;
    const target = btn.dataset.scrollTarget;
    scrollRow(direction, target);
  });
});

// Category buttons
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const categoria = btn.dataset.categoria;
    carregarCategoria(categoria);
  });
});

// Category scroll buttons
document.querySelectorAll(".cat-scroll").forEach(btn => {
  btn.addEventListener("click", () => {
    const direction = btn.classList.contains("left") ? -1 : 1;
    scrollCategorias(direction);
  });
});

// ================= EVENT DELEGATION FOR DYNAMIC CONTENT =================
// Play and Add buttons for cards
document.addEventListener("click", (e) => {
  // Play button click
  if (e.target.closest(".card-buttons .play")) {
    e.stopPropagation();
    const card = e.target.closest(".card");
    if (card && card.dataset.filme) {
      try {
        const item = JSON.parse(card.dataset.filme);
        abrirFilme(item);
      } catch (err) {
        console.error("Erro ao parsear filme:", err);
        mostrarToast("Erro ao abrir filme", "error");
      }
    }
  }

  // Add to list button click
  if (e.target.closest(".card-buttons .add")) {
    e.stopPropagation();
    const card = e.target.closest(".card");
    if (card && card.dataset.filme) {
      try {
        const item = JSON.parse(card.dataset.filme);
        addMinhaLista(item);
      } catch (err) {
        console.error("Erro ao parsear filme:", err);
        mostrarToast("Erro ao adicionar à lista", "error");
      }
    }
  }

  // Card click (open film)
  if (e.target.closest(".card") && !e.target.closest(".card-buttons")) {
    const card = e.target.closest(".card");
    if (card && card.dataset.filme) {
      try {
        const item = JSON.parse(card.dataset.filme);
        abrirFilme(item);
      } catch (err) {
        console.error("Erro ao parsear filme:", err);
        mostrarToast("Erro ao abrir filme", "error");
      }
    }
  }

  // Search result item click
  if (e.target.closest(".search-item")) {
    const searchItem = e.target.closest(".search-item");
    if (searchItem.dataset.filme) {
      try {
        const item = JSON.parse(searchItem.dataset.filme);
        abrirFilme(item);
      } catch (err) {
        console.error("Erro ao parsear filme:", err);
        mostrarToast("Erro ao abrir filme", "error");
      }
    }
  }
});

// ================= CARD HOVER - PAUSE BANNER TRAILER =================
document.addEventListener("mouseenter", (e) => {
  const card = e.target.closest(".card:not(.skeleton-card)");
  if (card && players[currentBannerIndex]) {
    players[currentBannerIndex].pauseVideo();
  }
}, true);

document.addEventListener("mouseleave", (e) => {
  const card = e.target.closest(".card:not(.skeleton-card)");
  if (card && players[currentBannerIndex]) {
    players[currentBannerIndex].playVideo();
  }
}, true);

// Login form
const loginForm = $("#loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#emailInput")?.value || "";
    const password = $("#passwordInput")?.value || "";
    
    if (!email || !password) {
      mostrarToast("Por favor, preencha todos os campos", "error");
      return;
    }

    // Simple validation (in production, use backend authentication)
    if (email.length > 0 && password.length > 0) {
      localStorage.setItem("usuario", email.split("@")[0]);
      localStorage.setItem("email", email);
      localStorage.setItem("autenticado", "true");
      mostrarToast("Bem-vindo!", "success");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    }
  });
}