const CONFIG = {
  API_KEY: "7ef74028ffed68ca7b35e0f0cf63c805",
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_URL: "https://image.tmdb.org/t/p/w300",
  IMG_LARGE: "https://image.tmdb.org/t/p/w1280"
};

const $ = (selector) => document.querySelector(selector);

function isInPagesDir() {
  return window.location.pathname.replace(/\\/g, "/").includes("/paginas/");
}

function getPagePath(pageName) {
  if (pageName === "index") {
    return isInPagesDir() ? "../index.html" : "index.html";
  }

  return isInPagesDir() ? `${pageName}.html` : `paginas/${pageName}.html`;
}

function redirectToHome() {
  window.location.href = getPagePath("home");
}

function setLoading(active) {
  $("#loadingOverlay")?.classList.toggle("active", active);
}

function mostrarToast(msg, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getYearFromDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return String(date.getFullYear());
}

function getImageUrl(path, large = false) {
  if (!path) {
    return "../assets/img/logo.png";
  }

  return `${large ? CONFIG.IMG_LARGE : CONFIG.IMG_URL}${path}`;
}

function normalizeContent(item, forcedMediaType = null) {
  return {
    id: item?.id,
    mediaType: forcedMediaType || item?.mediaType || item?.media_type || (item?.title ? "movie" : "tv"),
    title: item?.title || item?.name || item?.original_title || item?.original_name || "Sem titulo",
    overview: item?.overview || "Sem sinopse disponivel.",
    posterPath: item?.posterPath || item?.poster_path || "",
    backdropPath: item?.backdropPath || item?.backdrop_path || "",
    rating: Number(item?.rating ?? item?.vote_average ?? 0),
    year: item?.releaseYear || item?.year || getYearFromDate(item?.release_date || item?.first_air_date),
    releaseDate: item?.release_date || item?.first_air_date || "",
    duration: item?.duration || null
  };
}

function getStoredContent() {
  try {
    const raw = JSON.parse(localStorage.getItem("filme"));
    return normalizeContent(raw);
  } catch (error) {
    console.error(error);
    return null;
  }
}

let conteudoAtual = getStoredContent();

if (!conteudoAtual?.id) {
  redirectToHome();
}

function formatDuration(data) {
  if (conteudoAtual.mediaType === "movie") {
    const runtime = data?.runtime || conteudoAtual.duration;
    if (!runtime) return "Duracao indisponivel";

    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (!hours) return `${minutes} min`;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  }

  const episodeRuntime = data?.episode_run_time?.[0];
  if (episodeRuntime) {
    return `${episodeRuntime} min/ep`;
  }

  const seasons = data?.number_of_seasons;
  if (seasons) {
    return `${seasons} temporada${seasons > 1 ? "s" : ""}`;
  }

  return "Serie";
}

function getTypeLabel() {
  return conteudoAtual.mediaType === "movie" ? "Filme" : "Serie";
}

function preencherCabecalhoBase() {
  $("#detailsTitle").textContent = conteudoAtual.title;
  $("#detailsOverview").textContent = conteudoAtual.overview;
  $("#detailsPoster").src = getImageUrl(conteudoAtual.posterPath);
  $("#detailsPoster").alt = `Poster de ${conteudoAtual.title}`;
  $("#heroBackdrop").style.backgroundImage = `url('${getImageUrl(conteudoAtual.backdropPath || conteudoAtual.posterPath, true)}')`;
  $("#detailsRatingValue").textContent = (conteudoAtual.rating || 0).toFixed(1);
  $("#detailsYear").textContent = conteudoAtual.year || "Ano indisponivel";
  $("#detailsDuration").textContent = conteudoAtual.duration || "Carregando...";
  $("#detailsType").textContent = getTypeLabel();
  $("#detailsBadge").textContent = conteudoAtual.mediaType === "movie" ? "ESTREIA" : "SERIE";
  document.title = `${conteudoAtual.title} - Cine+`;
}

function preencherGeneros(generos = []) {
  const container = $("#detailsGenres");
  if (!container) return;

  container.innerHTML = "";

  if (!generos.length) {
    const badge = document.createElement("span");
    badge.className = "genre-tag";
    badge.textContent = "Catalogo";
    container.appendChild(badge);
    return;
  }

  generos.slice(0, 4).forEach((genero) => {
    const badge = document.createElement("span");
    badge.className = "genre-tag";
    badge.textContent = genero.name;
    container.appendChild(badge);
  });
}

function preencherInfosExtras(data) {
  const directorEl = $("#detailsDirector");
  const castEl = $("#detailsCast");
  const countryEl = $("#detailsCountry");
  const languageEl = $("#detailsLanguage");

  if (conteudoAtual.mediaType === "movie") {
    const diretor = data?.credits?.crew?.find((person) => person.job === "Director");
    directorEl.textContent = diretor?.name || "-";
  } else {
    directorEl.textContent = data?.created_by?.map((person) => person.name).filter(Boolean).join(", ") || "-";
  }

  const castList = data?.credits?.cast || data?.aggregate_credits?.cast || [];
  castEl.textContent = castList.slice(0, 4).map((person) => person.name).join(", ") || "-";

  const productionCountries = data?.production_countries?.map((country) => country.name).filter(Boolean) || [];
  const originCountries = data?.origin_country?.filter(Boolean) || [];
  const countries = productionCountries.length ? productionCountries : originCountries;
  countryEl.textContent = countries.length ? countries.join(", ") : "-";

  const language =
    data?.spoken_languages?.[0]?.name ||
    data?.spoken_languages?.[0]?.english_name ||
    (data?.original_language ? data.original_language.toUpperCase() : "-");
  languageEl.textContent = language;
}

function preencherDetalhesCompletos(data) {
  conteudoAtual = {
    ...conteudoAtual,
    posterPath: data?.poster_path || conteudoAtual.posterPath,
    backdropPath: data?.backdrop_path || conteudoAtual.backdropPath,
    overview: data?.overview || conteudoAtual.overview,
    rating: Number(data?.vote_average ?? conteudoAtual.rating ?? 0),
    year: getYearFromDate(data?.release_date || data?.first_air_date) || conteudoAtual.year,
    duration: formatDuration(data)
  };

  preencherCabecalhoBase();
  preencherGeneros(data?.genres || []);
  preencherInfosExtras(data);
}

function getAppendRequests() {
  if (conteudoAtual.mediaType === "movie") {
    return "credits,videos,similar,release_dates";
  }

  return "aggregate_credits,videos,similar,content_ratings";
}

async function fetchDetalhes() {
  try {
    const url =
      `${CONFIG.BASE_URL}/${conteudoAtual.mediaType}/${conteudoAtual.id}` +
      `?api_key=${CONFIG.API_KEY}&language=pt-BR&append_to_response=${getAppendRequests()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    mostrarToast("Nao foi possivel carregar os detalhes completos.", "error");
    return null;
  }
}

function renderTrailer(videos = []) {
  const trailerFrame = $("#trailerFrame");
  const trailerFallback = $("#trailerFallback");
  const trailerWrapper = $("#trailerWrapper");

  const trailer =
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.iso_639_1 === "pt") ||
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ||
    videos.find((video) => video.site === "YouTube");

  if (!trailer) {
    trailerFrame.removeAttribute("src");
    trailerWrapper.hidden = true;
    trailerFallback.hidden = false;
    return;
  }

  trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=0&controls=1&modestbranding=1&rel=0`;
  trailerWrapper.hidden = false;
  trailerFallback.hidden = true;
}

function createSimilarCard(item) {
  const normalized = normalizeContent(item, conteudoAtual.mediaType);

  const card = document.createElement("button");
  card.type = "button";
  card.className = "similar-card";

  const poster = document.createElement("img");
  poster.className = "similar-poster";
  poster.src = getImageUrl(normalized.posterPath);
  poster.alt = `Poster de ${normalized.title}`;

  const info = document.createElement("div");
  info.className = "similar-card-info";

  const title = document.createElement("h3");
  title.className = "similar-title";
  title.textContent = normalized.title;

  const meta = document.createElement("div");
  meta.className = "similar-meta";
  meta.textContent = `${normalized.year || "Ano desconhecido"} - Nota ${(normalized.rating || 0).toFixed(1)}`;

  info.appendChild(title);
  info.appendChild(meta);
  card.appendChild(poster);
  card.appendChild(info);

  card.addEventListener("click", () => {
    localStorage.setItem("filme", JSON.stringify(normalized));
    window.location.href = getPagePath("detalhes");
  });

  return card;
}

function renderSimilares(items = []) {
  const grid = $("#similaresGrid");
  const fallback = $("#similarFallback");
  if (!grid || !fallback) return;

  grid.innerHTML = "";

  const validItems = items.filter((item) => item.poster_path || item.posterPath).slice(0, 8);

  if (!validItems.length) {
    fallback.hidden = false;
    return;
  }

  fallback.hidden = true;
  validItems.forEach((item) => {
    grid.appendChild(createSimilarCard(item));
  });
}

function getMinhaLista() {
  return JSON.parse(localStorage.getItem("lista")) || [];
}

function estaNaMinhaLista() {
  return getMinhaLista().some((item) => item.id === conteudoAtual.id);
}

function atualizarBotaoLista() {
  const button = $("#detailsListBtn");
  const label = $("#detailsListLabel");
  if (!button || !label) return;

  const ativo = estaNaMinhaLista();
  button.classList.toggle("active", ativo);
  label.textContent = ativo ? "Remover da Lista" : "Minha Lista";
}

function toggleMinhaLista() {
  let lista = getMinhaLista();
  const ativo = lista.some((item) => item.id === conteudoAtual.id);

  if (ativo) {
    lista = lista.filter((item) => item.id !== conteudoAtual.id);
    mostrarToast("Removido da sua lista.", "info");
  } else {
    lista.push({
      id: conteudoAtual.id,
      mediaType: conteudoAtual.mediaType,
      media_type: conteudoAtual.mediaType,
      title: conteudoAtual.title,
      overview: conteudoAtual.overview,
      posterPath: conteudoAtual.posterPath,
      poster_path: conteudoAtual.posterPath,
      backdropPath: conteudoAtual.backdropPath,
      backdrop_path: conteudoAtual.backdropPath,
      rating: conteudoAtual.rating,
      vote_average: conteudoAtual.rating,
      releaseYear: conteudoAtual.year
    });
    mostrarToast("Adicionado a sua lista.", "success");
  }

  localStorage.setItem("lista", JSON.stringify(lista));
  atualizarBotaoLista();
}

async function compartilharConteudo() {
  const shareData = {
    title: conteudoAtual.title,
    text: `Veja ${conteudoAtual.title} no Cine+`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
      mostrarToast("Link copiado.", "success");
      return;
    }

    mostrarToast("Compartilhamento indisponivel neste navegador.", "info");
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      mostrarToast("Nao foi possivel compartilhar.", "error");
    }
  }
}

function setupEventListeners() {
  $("#backBtn")?.addEventListener("click", () => {
    redirectToHome();
  });

  $("#detailsPlayBtn")?.addEventListener("click", () => {
    mostrarToast(`Preparando ${conteudoAtual.title}...`, "success");
  });

  $("#detailsListBtn")?.addEventListener("click", () => {
    toggleMinhaLista();
  });

  $("#detailsShareBtn")?.addEventListener("click", () => {
    compartilharConteudo();
  });
}

function setupScrollNavbar() {
  const navbar = $(".navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

async function inicializarDetalhes() {
  if (!conteudoAtual?.id) return;

  try {
    setLoading(true);
    preencherCabecalhoBase();
    preencherGeneros([]);
    atualizarBotaoLista();
    setupEventListeners();
    setupScrollNavbar();

    const data = await fetchDetalhes();

    if (data) {
      preencherDetalhesCompletos(data);
      renderTrailer(data?.videos?.results || []);
      renderSimilares(data?.similar?.results || []);
    } else {
      renderTrailer([]);
      renderSimilares([]);
    }
  } finally {
    setLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", inicializarDetalhes);
