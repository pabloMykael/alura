// ================= CONFIG =================
const CONFIG = {
  API_KEY: "7ef74028ffed68ca7b35e0f0cf63c805",
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_URL: "https://image.tmdb.org/t/p/w300",
  IMG_LARGE: "https://image.tmdb.org/t/p/w1280"
};

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// ================= OBTER FILME ================
const filme = JSON.parse(localStorage.getItem("filme"));

if (!filme) {
  window.location.href = "/paginas/home.html";
}

// ================= INICIALIZAR =================
async function inicializarDetalhes() {
  // Preencher informações básicas
  preencherInformacoes();
  
  // Carregar dados complementares da API
  await carregarDadosFilme();
  
  // Carregar trailer
  await carregarTrailer();
  
  // Carregar similares
  await carregarSimilares();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup scroll navbar
  setupScrollNavbar();
}

// ================= PREENCHER INFORMAÇÕES =================
function preencherInformacoes() {
  // Título
  $("#detailsTitle").innerText = filme.title || filme.name || "";
  
  // Sinopse
  $("#detailsOverview").innerText = filme.overview || "Sem sinopse disponível...";
  
  // Poster
  $("#detailsPoster").src = CONFIG.IMG_URL + filme.posterPath;
  $("#detailsPoster").alt = filme.title || filme.name;
  
  // Backdrop
  const backdropUrl = CONFIG.IMG_LARGE + filme.backdropPath;
  $("#heroBackdrop").style.backgroundImage = `url('${backdropUrl}')`;
  
  // Rating
  $("#detailsRatingValue").innerText = (filme.rating || 8.5).toFixed(1);
  
  // Ano
  $("#detailsYear").innerText = filme.releaseYear || new Date().getFullYear();
  
  // Tipo
  $("#detailsType").innerText = filme.title ? "Filme" : "Série";
}

// ================= CARREGAR DADOS DO FILME =================
async function carregarDadosFilme() {
  try {
    const tipo = filme.title ? "movie" : "tv";
    const url = `${CONFIG.BASE_URL}/${tipo}/${filme.id}?api_key=${CONFIG.API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Gêneros
    if (data.genres && data.genres.length > 0) {
      const genresContainer = $("#detailsGenres");
      genresContainer.innerHTML = "";
      
      data.genres.slice(0, 3).forEach(genre => {
        const badge = document.createElement("span");
        badge.className = "genre-badge";
        badge.innerText = genre.name;
        genresContainer.appendChild(badge);
      });
    }
    
    // Diretor/Criador (primeiro item de credits, se houver)
    if (tipo === "movie" && data.credits?.crew) {
      const director = data.credits.crew.find(c => c.job === "Director");
      if (director) {
        $("#detailsDirector").innerText = director.name;
      }
    } else if (tipo === "tv" && data.created_by) {
      $("#detailsDirector").innerText = data.created_by[0]?.name || "-";
    }
    
    // Elenco
    const cast = data.credits?.cast || data.aggregate_credits?.cast || [];
    if (cast.length > 0) {
      const castNames = cast.slice(0, 3).map(c => c.name).join(", ");
      $("#detailsCast").innerText = castNames;
    }
    
  } catch (error) {
    console.error("Erro ao carregar dados do filme:", error);
  }
}

// ================= CARREGAR TRAILER =================
async function carregarTrailer() {
  try {
    const tipo = filme.title ? "movie" : "tv";
    const url = `${CONFIG.BASE_URL}/${tipo}/${filme.id}/videos?api_key=${CONFIG.API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Procurar por trailer em PT ou EN
    let trailer = data.results.find(v => 
      v.type === "Trailer" && v.site === "YouTube"
    );
    
    if (!trailer) {
      // Tentar em inglês se não encontrar em português
      const urlEn = `${CONFIG.BASE_URL}/${tipo}/${filme.id}/videos?api_key=${CONFIG.API_KEY}&language=en`;
      const response_en = await fetch(urlEn);
      const data_en = await response_en.json();
      trailer = data_en.results.find(v => 
        v.type === "Trailer" && v.site === "YouTube"
      );
    }
    
    if (trailer) {
      const trailerFrame = $("#trailerFrame");
      trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=0&controls=1&modestbranding=1`;
    } else {
      // Mostrar mensagem se não encontrar trailer
      const trailerSection = $("#trailerSection");
      if (trailerSection) {
        trailerSection.innerHTML = '<p style="padding: 40px 60px; text-align: center; color: #999;">Trailer não disponível</p>';
      }
    }
    
  } catch (error) {
    console.error("Erro ao carregar trailer:", error);
  }
}

// ================= CARREGAR SIMILARES =================
async function carregarSimilares() {
  try {
    const tipo = filme.title ? "movie" : "tv";
    const url = `${CONFIG.BASE_URL}/${tipo}/${filme.id}/similar?api_key=${CONFIG.API_KEY}&language=pt-BR`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return;
    
    const container = document.createElement("div");
    container.className = "similares-container";
    
    const title = document.createElement("h2");
    title.innerText = "Conteúdo Semelhante";
    container.appendChild(title);
    
    const grid = document.createElement("div");
    grid.className = "similares-grid";
    
    data.results.slice(0, 10).forEach(item => {
      if (!item.poster_path) return;
      
      const card = document.createElement("div");
      card.className = "similar-card";
      card.onclick = () => carregarFilmeSemelhante(item);
      
      const img = document.createElement("img");
      img.src = CONFIG.IMG_URL + item.poster_path;
      img.alt = item.title || item.name;
      card.appendChild(img);
      
      const overlay = document.createElement("div");
      overlay.className = "similar-card-overlay";
      
      const info = document.createElement("div");
      info.className = "similar-card-info";
      
      const h3 = document.createElement("h3");
      h3.innerText = item.title || item.name;
      info.appendChild(h3);
      
      overlay.appendChild(info);
      card.appendChild(overlay);
      
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    const section = document.createElement("section");
    section.className = "similares-section";
    section.appendChild(container);
    
    document.body.appendChild(section);
    
  } catch (error) {
    console.error("Erro ao carregar similares:", error);
  }
}

// ================= CARREGAR FILME SEMELHANTE =================
function carregarFilmeSemelhante(item) {
  const novoFilme = {
    id: item.id,
    title: item.title || item.name,
    overview: item.overview,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    rating: item.vote_average,
    releaseYear: new Date(item.release_date || item.first_air_date).getFullYear()
  };
  
  localStorage.setItem("filme", JSON.stringify(novoFilme));
  window.location.reload();
}

// ================= SETUP EVENT LISTENERS =================
function setupEventListeners() {
  // Botão voltar
  const backBtn = $("#backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/paginas/home.html";
    });
  }
  
  // Botão assistir
  const playBtn = $("#detailsPlayBtn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      mostrarToast("Reproduzindo " + (filme.title || filme.name), "success");
      // Aqui poderia abrir um player integrado ou fazer streaming
    });
  }
  
  // Botão minha lista
  const listBtn = $("#detailsListBtn");
  if (listBtn) {
    listBtn.addEventListener("click", () => {
      adicionarMinhaLista();
    });
  }
}

// ================= ADICIONAR À LISTA =================
function adicionarMinhaLista() {
  let lista = JSON.parse(localStorage.getItem("lista")) || [];
  
  const jaExiste = lista.find(f => f.id === filme.id);
  
  if (jaExiste) {
    // Remover
    lista = lista.filter(f => f.id !== filme.id);
    mostrarToast("Removido de Minha Lista", "info");
    
    const btn = $("#detailsListBtn");
    if (btn) btn.classList.remove("active");
  } else {
    // Adicionar
    lista.push({
      id: filme.id,
      title: filme.title || filme.name,
      posterPath: filme.posterPath
    });
    mostrarToast("Adicionado a Minha Lista!", "success");
    
    const btn = $("#detailsListBtn");
    if (btn) btn.classList.add("active");
  }
  
  localStorage.setItem("lista", JSON.stringify(lista));
}

// ================= TOAST =================
function mostrarToast(msg, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ================= SETUP SCROLL NAVBAR =================
function setupScrollNavbar() {
  const navbar = $(".navbar");
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }
  });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", inicializarDetalhes);