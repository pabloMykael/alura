const CONFIG = {
  API_KEY: "7ef74028ffed68ca7b35e0f0cf63c805",
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_URL: "https://image.tmdb.org/t/p/w300"
};

const CACHE_TIME = 1000 * 60 * 30;
const HOME_MOVIE_CATEGORIES = new Set(["popular", "top_rated", "upcoming", "now_playing"]);
const HOME_CATEGORY_LABELS = {
  popular: "Populares",
  top_rated: "Melhores avaliados",
  upcoming: "Em breve",
  now_playing: "Em cartaz"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let timeoutBusca;

function isInPagesDir() {
  return window.location.pathname.replace(/\\/g, "/").includes("/paginas/");
}

function getPagePath(pageName) {
  if (pageName === "index") {
    return isInPagesDir() ? "../index.html" : "index.html";
  }

  return isInPagesDir() ? `${pageName}.html` : `paginas/${pageName}.html`;
}

function getAssetPath(assetPath) {
  return isInPagesDir() ? `../${assetPath}` : assetPath;
}

function getUsuarioAtual() {
  const usuario = localStorage.getItem("usuario");
  if (usuario) return usuario;

  const email = localStorage.getItem("email");
  if (email) return email.split("@")[0];

  return "Usuario";
}

function mostrarToast(msg, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function mostrarLoading(id = "catalogo", count = 10) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = "";
  el.classList.add("loading-skeletons");

  for (let i = 0; i < count; i += 1) {
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

async function fetchAPI(url) {
  try {
    const key = `cache_${url}`;
    const cache = localStorage.getItem(key);

    if (cache) {
      const { data, time } = JSON.parse(cache);
      if (Date.now() - time < CACHE_TIME) {
        return data;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data = await response.json();
    localStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
    return data;
  } catch (error) {
    console.error(error);
    mostrarToast("Erro ao buscar dados.", "error");
    return null;
  }
}

function limparCacheAntigo() {
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("cache_")) return;

    try {
      const { time } = JSON.parse(localStorage.getItem(key));
      if (Date.now() - time > CACHE_TIME) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  });
}

function logout() {
  localStorage.clear();
  window.location.href = getPagePath("login");
}

function entrar(link) {
  const nome =
    link.closest(".profile-item")?.querySelector(".profile-name")?.textContent?.trim() ||
    link.getAttribute("aria-label")?.replace("Acessar perfil ", "") ||
    "Usuario";

  localStorage.setItem("usuario", nome);
  $("#transition")?.classList.add("active");
}

window.entrar = entrar;

function getMinhaListaSalva() {
  return JSON.parse(localStorage.getItem("lista")) || [];
}

async function carregarFilmes(tipo = "movie", categoria = "popular", limpar = true, seletor = "#catalogo") {
  if (limpar) {
    mostrarLoading(seletor.replace("#", ""));
  }

  const data = await fetchAPI(
    `${CONFIG.BASE_URL}/${tipo}/${categoria}?api_key=${CONFIG.API_KEY}&language=pt-BR&page=1`
  );

  if (data?.results) {
    renderFilmes(data.results, limpar, seletor);
  }
}

async function carregarSeries(categoria = "popular", limpar = true, seletor = "#catalogo-series") {
  await carregarFilmes("tv", categoria, limpar, seletor);
}

async function carregarCategoria(categoria) {
  if (!categoria) return;

  if (HOME_MOVIE_CATEGORIES.has(categoria)) {
    await carregarFilmes("movie", categoria, true, "#catalogo");
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    mostrarToast(`Mostrando: ${HOME_CATEGORY_LABELS[categoria] || categoria}`, "info");
    return;
  }

  mostrarToast(`Categoria selecionada: ${categoria}`, "info");
}

function mostrarMinhaLista() {
  const lista = getMinhaListaSalva();

  if (!lista.length) {
    mostrarToast("Sua lista ainda esta vazia.", "info");
    return;
  }

  renderFilmes(lista, true, "#catalogo");
  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  mostrarToast("Exibindo sua lista.", "info");
}

function renderFilmes(lista, limpar = true, seletor = "#catalogo") {
  const container = $(seletor);
  if (!container || !lista) return;

  if (limpar) {
    container.innerHTML = "";
  }

  container.classList.remove("loading-skeletons");

  lista.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.filmeId = item.id;
    card.dataset.filme = JSON.stringify(item);
    card.style.animation = `fadeInScale 0.5s ease-out ${index * 0.05}s backwards`;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.poster_path || item.posterPath
      ? `${CONFIG.IMG_URL}${item.poster_path || item.posterPath}`
      : getAssetPath("assets/img/logo.png");
    img.alt = item.title || item.name || "Capa do conteudo";

    const info = document.createElement("div");
    info.className = "card-info";
    info.innerHTML = `
      <h4>${item.title || item.name || "Sem titulo"}</h4>
      <div class="card-buttons">
        <button class="play" aria-label="Assistir">Play</button>
        <button class="add" aria-label="Adicionar a lista">+ Lista</button>
      </div>
      <div class="rating">Nota ${item.vote_average?.toFixed(1) || "N/A"}</div>
    `;

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

function addMinhaLista(item) {
  let lista = getMinhaListaSalva();
  const existe = lista.find((filme) => filme.id === item.id);

  if (existe) {
    lista = lista.filter((filme) => filme.id !== item.id);
    mostrarToast("Removido da lista.", "error");
  } else {
    lista.push(item);
    mostrarToast("Adicionado a lista.", "success");
  }

  localStorage.setItem("lista", JSON.stringify(lista));
}

function abrirFilme(item) {
  localStorage.setItem("filme", JSON.stringify(item));
  window.location.href = getPagePath("detalhes");
}

function renderSearchResults(lista) {
  const searchResults = $("#searchResults");
  if (!searchResults) return;

  searchResults.innerHTML = "";

  if (!lista.length) {
    searchResults.innerHTML = `<div style="padding: 12px; text-align: center;">Nenhum resultado encontrado.</div>`;
    searchResults.style.display = "block";
    return;
  }

  lista.slice(0, 5).forEach((item) => {
    const result = document.createElement("div");
    result.className = "search-item";
    result.dataset.filme = JSON.stringify(item);

    const poster = document.createElement("img");
    poster.src = item.poster_path ? `${CONFIG.IMG_URL}${item.poster_path}` : getAssetPath("assets/img/logo.png");
    poster.alt = item.title || item.name || "Resultado";

    const title = document.createElement("span");
    title.textContent = item.title || item.name || "Sem titulo";

    result.appendChild(poster);
    result.appendChild(title);
    searchResults.appendChild(result);
  });

  searchResults.style.display = "block";
}

function fecharBusca() {
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");

  searchInput?.classList.remove("active");
  if (searchInput) searchInput.value = "";
  if (searchResults) {
    searchResults.innerHTML = "";
    searchResults.style.display = "none";
  }
}

function buscarFilmes(query) {
  clearTimeout(timeoutBusca);

  if (!query || query.length < 3) {
    const searchResults = $("#searchResults");
    if (searchResults) {
      searchResults.innerHTML = "";
      searchResults.style.display = "none";
    }
    return;
  }

  timeoutBusca = setTimeout(async () => {
    const data = await fetchAPI(
      `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
    );

    renderSearchResults(data?.results || []);
  }, 300);
}

function scrollRow(direction, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scrollAmount = container.clientWidth * 0.65;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;
  let newScroll = currentScroll + direction * scrollAmount;

  newScroll = Math.max(0, Math.min(newScroll, maxScroll));

  container.scrollBy({
    left: newScroll - currentScroll,
    behavior: "smooth"
  });

  updateScrollButtons(containerId);
}

function updateScrollButtons(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const buttons = document.querySelectorAll(`[data-scroll-target="${containerId}"]`);
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;

  buttons.forEach((button) => {
    const isLeft = button.classList.contains("left");
    const disabled = isLeft ? currentScroll <= 0 : currentScroll >= maxScroll;

    button.style.opacity = disabled ? "0.3" : "0.82";
    button.style.pointerEvents = disabled ? "none" : "auto";
  });
}

function scrollCategorias(direction) {
  const container = $("#categorias-container");
  if (!container) return;

  const scrollAmount = container.clientWidth * 0.65;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;
  let newScroll = currentScroll + direction * scrollAmount;

  newScroll = Math.max(0, Math.min(newScroll, maxScroll));

  container.scrollBy({
    left: newScroll - currentScroll,
    behavior: "smooth"
  });

  updateCategoriaScrollButtons();
}

function updateCategoriaScrollButtons() {
  const container = $("#categorias-container");
  if (!container) return;

  const leftBtn = $(".cat-scroll.left");
  const rightBtn = $(".cat-scroll.right");
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;

  if (leftBtn) {
    leftBtn.style.opacity = currentScroll <= 0 ? "0.3" : "0.82";
    leftBtn.style.pointerEvents = currentScroll <= 0 ? "none" : "auto";
  }

  if (rightBtn) {
    rightBtn.style.opacity = currentScroll >= maxScroll ? "0.3" : "0.82";
    rightBtn.style.pointerEvents = currentScroll >= maxScroll ? "none" : "auto";
  }
}

function initNavbar() {
  const navbar = $(".navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

function initDropdown() {
  const avatarButton = $("#avatarUsuario");
  const dropdown = $("#dropdown");
  const nomeUsuario = $("#nomeUsuario");

  if (nomeUsuario) {
    nomeUsuario.textContent = getUsuarioAtual();
  }

  if (!avatarButton || !dropdown) return;

  avatarButton.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("active");
    avatarButton.setAttribute("aria-expanded", dropdown.classList.contains("active"));
  });

  document.addEventListener("click", (event) => {
    if (dropdown.contains(event.target) || avatarButton.contains(event.target)) return;
    dropdown.classList.remove("active");
    avatarButton.setAttribute("aria-expanded", "false");
  });
}

function initSearch() {
  const searchIcon = $("#searchIcon");
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");

  if (!searchIcon || !searchInput || !searchResults) return;

  searchIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    searchInput.classList.toggle("active");
    searchInput.focus();
  });

  searchInput.addEventListener("input", (event) => {
    buscarFilmes(event.target.value.trim());
  });

  document.addEventListener("click", (event) => {
    if (searchIcon.contains(event.target) || searchInput.contains(event.target) || searchResults.contains(event.target)) {
      return;
    }

    fecharBusca();
  });
}

function initHomePage() {
  const catalogo = $("#catalogo");
  const catalogoSeries = $("#catalogo-series");

  if (!catalogo || !catalogoSeries) return;

  initNavbar();
  initDropdown();
  initSearch();

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const categoria = link.dataset.categoria;

      if (categoria === "minhaLista") {
        mostrarMinhaLista();
        return;
      }

      carregarCategoria(categoria);
    });
  });

  $(".logout-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
  });

  $$(".scroll-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.classList.contains("left") ? -1 : 1;
      scrollRow(direction, button.dataset.scrollTarget);
    });
  });

  $$(".cat-btn").forEach((button) => {
    button.addEventListener("click", () => {
      carregarCategoria(button.dataset.categoria);
    });
  });

  $$(".cat-scroll").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.classList.contains("left") ? -1 : 1;
      scrollCategorias(direction);
    });
  });

  catalogo.addEventListener("scroll", () => updateScrollButtons("catalogo"));
  catalogoSeries.addEventListener("scroll", () => updateScrollButtons("catalogo-series"));
  $("#categorias-container")?.addEventListener("scroll", updateCategoriaScrollButtons);

  carregarFilmes("movie", "popular", true, "#catalogo");
  carregarSeries("popular", true, "#catalogo-series");

  setTimeout(() => {
    updateScrollButtons("catalogo");
    updateScrollButtons("catalogo-series");
    updateCategoriaScrollButtons();
  }, 300);
}

function initDocumentActions() {
  document.addEventListener("click", (event) => {
    const playButton = event.target.closest(".card-buttons .play");
    if (playButton) {
      event.stopPropagation();
      const card = playButton.closest(".card");

      if (card?.dataset.filme) {
        try {
          abrirFilme(JSON.parse(card.dataset.filme));
        } catch (error) {
          console.error(error);
          mostrarToast("Erro ao abrir filme.", "error");
        }
      }
      return;
    }

    const addButton = event.target.closest(".card-buttons .add");
    if (addButton) {
      event.stopPropagation();
      const card = addButton.closest(".card");

      if (card?.dataset.filme) {
        try {
          addMinhaLista(JSON.parse(card.dataset.filme));
        } catch (error) {
          console.error(error);
          mostrarToast("Erro ao atualizar a lista.", "error");
        }
      }
      return;
    }

    const card = event.target.closest(".card");
    if (card && !event.target.closest(".card-buttons") && card.dataset.filme) {
      try {
        abrirFilme(JSON.parse(card.dataset.filme));
      } catch (error) {
        console.error(error);
        mostrarToast("Erro ao abrir filme.", "error");
      }
      return;
    }

    const searchItem = event.target.closest(".search-item");
    if (searchItem?.dataset.filme) {
      try {
        abrirFilme(JSON.parse(searchItem.dataset.filme));
      } catch (error) {
        console.error(error);
        mostrarToast("Erro ao abrir filme.", "error");
      }
    }
  });
}

function initLoginForm() {
  const loginForm = $("#loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = $("#emailInput")?.value?.trim() || "";
    const password = $("#passwordInput")?.value?.trim() || "";

    if (!email || !password) {
      mostrarToast("Por favor, preencha todos os campos.", "error");
      return;
    }

    localStorage.setItem("usuario", email.split("@")[0]);
    localStorage.setItem("email", email);
    localStorage.setItem("autenticado", "true");
    mostrarToast("Bem-vindo!", "success");

    setTimeout(() => {
      window.location.href = getPagePath("index");
    }, 500);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  limparCacheAntigo();
  initDocumentActions();
  initLoginForm();
  initHomePage();
});
