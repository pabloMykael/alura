// ================= HERO CAROUSEL - APPLE TV STYLE =================

function getHeroPagePath(pageName) {
  const inPagesDir = window.location.pathname.replace(/\\/g, "/").includes("/paginas/");

  if (pageName === "index") {
    return inPagesDir ? "../index.html" : "index.html";
  }

  return inPagesDir ? `${pageName}.html` : `paginas/${pageName}.html`;
}

class HeroCarousel {
  constructor() {
    this.currentIndex = 0;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 7000; // 7 segundos
    this.movies = [];
    this.isTransitioning = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.init();
  }

  init() {
    this.setupElements();
    this.attachEventListeners();
    this.startAutoPlay();
  }

  setupElements() {
    this.container = document.querySelector('.hero-carousel');
    this.slidesContainer = document.querySelector('.hero-slides-container');
    this.indicators = document.querySelector('.hero-indicators');
    this.prevBtn = document.querySelector('.hero-nav-prev');
    this.nextBtn = document.querySelector('.hero-nav-next');
  }

  attachEventListeners() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSlide());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSlide());

    // Pause autoplay on hover
    if (this.container) {
      this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
      this.container.addEventListener('mouseleave', () => this.startAutoPlay());
      this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    // Click on indicators
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('hero-indicator')) {
        const index = Array.from(this.indicators.children).indexOf(e.target);
        if (index !== -1) this.goToSlide(index);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });
  }

  // Handle mouse movement for subtle parallax
  handleMouseMove(e) {
    const activeSlide = this.slidesContainer?.querySelector('.hero-slide.active');
    if (!activeSlide) return;

    const rect = this.container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const bgElement = activeSlide.querySelector('.hero-slide-background');
    if (bgElement) {
      const moveX = (x - 0.5) * 5;
      const moveY = (y - 0.5) * 5;
      bgElement.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
    }
  }

  // Load movies from API
  async loadMovies() {
    try {
      const CONFIG = {
        API_KEY: "7ef74028ffed68ca7b35e0f0cf63c805",
        BASE_URL: "https://api.themoviedb.org/3",
        IMG_URL: "https://image.tmdb.org/t/p/w1280"
      };

      const url = `${CONFIG.BASE_URL}/movie/popular?api_key=${CONFIG.API_KEY}&language=pt-BR`;
      const response = await fetch(url);
      const data = await response.json();

      this.movies = data.results.slice(0, 6); // Aumentado para 6 filmes
      this.renderSlides();
    } catch (error) {
      console.error('Erro ao carregar filmes:', error);
    }
  }

  // Render all slides
  renderSlides() {
    if (!this.slidesContainer) return;

    // Clear existing slides
    const existingSlides = this.slidesContainer.querySelectorAll('.hero-slide');
    existingSlides.forEach((slide, idx) => {
      if (idx > 0) slide.remove();
    });

    // Clone first slide for each movie
    const firstSlide = this.slidesContainer.querySelector('.hero-slide');

    this.movies.forEach((movie, idx) => {
      let slide;
      if (idx === 0) {
        slide = firstSlide;
      } else {
        slide = firstSlide.cloneNode(true);
        this.slidesContainer.appendChild(slide);
      }

      this.updateSlideContent(slide, movie, idx);
    });

    // Create indicators
    this.createIndicators();

    // Update first slide
    this.updateSlide(0);
  }

  // Update slide content
  updateSlideContent(slide, movie, index) {
    if (!movie.backdrop_path) return;

    const backdropUrl = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;

    // Background
    const bgElement = slide.querySelector('.hero-slide-background');
    if (bgElement) {
      bgElement.style.backgroundImage = `url('${backdropUrl}')`;
    }

    // Badge - status do filme
    const badge = slide.querySelector('.hero-badge');
    if (badge) {
      const badgeText = movie.vote_average >= 7 ? 'TRENDING' : 'POPULAR';
      badge.textContent = badgeText;
    }

    // Title
    const title = slide.querySelector('.hero-slide-title');
    if (title) {
      title.textContent = movie.title || movie.name;
    }

    // Description
    const desc = slide.querySelector('.hero-slide-description');
    if (desc) {
      desc.textContent = movie.overview || 'Descubra histórias incríveis';
    }

    // Rating
    const rating = slide.querySelector('.hero-rating span:last-child');
    if (rating) {
      rating.textContent = movie.vote_average.toFixed(1);
    }

    // Year
    const year = slide.querySelector('.hero-year');
    if (year) {
      const releaseYear = new Date(movie.release_date).getFullYear();
      year.textContent = releaseYear || 'N/A';
    }

    // Duration placeholder (TMDB não fornece em popular endpoint)
    const duration = slide.querySelector('.hero-duration');
    if (duration) {
      duration.textContent = '2h 30m';
    }

    // Store movie data
    slide.dataset.movieId = movie.id;
    slide.dataset.movieData = JSON.stringify(movie);
  }

  // Create indicator elements
  createIndicators() {
    if (!this.indicators) return;

    this.indicators.innerHTML = '';
    this.movies.forEach((_, idx) => {
      const indicator = document.createElement('div');
      indicator.className = 'hero-indicator';
      if (idx === 0) indicator.classList.add('active');
      this.indicators.appendChild(indicator);
    });
  }

  // Update slide visibility with smooth transitions
  updateSlide(index) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const slides = this.slidesContainer.querySelectorAll('.hero-slide');
    const indicators = this.indicators.querySelectorAll('.hero-indicator');

    slides.forEach((slide, idx) => {
      slide.classList.remove('active', 'prev');
      if (idx === index) {
        slide.classList.add('active');
      } else if (idx === index - 1 || (index === 0 && idx === slides.length - 1)) {
        slide.classList.add('prev');
      }
    });

    indicators.forEach((indicator, idx) => {
      indicator.classList.remove('active');
      if (idx === index) {
        indicator.classList.add('active');
        this.animateProgressBar(indicator);
      }
    });

    this.currentIndex = index;

    setTimeout(() => {
      this.isTransitioning = false;
      this.resetAutoPlay();
    }, 800);
  }

  // Animate progress bar
  animateProgressBar(indicator) {
    indicator.style.setProperty('--hero-progress-duration', `${this.autoPlayDelay}ms`);
    indicator.style.setProperty('--progress', '0%');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        indicator.style.setProperty('--progress', '100%');
      });
    });
  }

  // Navigation with transition control
  nextSlide() {
    if (this.isTransitioning) return;
    const nextIndex = (this.currentIndex + 1) % this.movies.length;
    this.updateSlide(nextIndex);
  }

  prevSlide() {
    if (this.isTransitioning) return;
    const prevIndex = this.currentIndex === 0 ? this.movies.length - 1 : this.currentIndex - 1;
    this.updateSlide(prevIndex);
  }

  goToSlide(index) {
    if (this.isTransitioning) return;
    if (index >= 0 && index < this.movies.length) {
      this.updateSlide(index);
    }
  }

  // Auto-play management
  startAutoPlay() {
    if (this.autoPlayInterval) return;

    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.hero-carousel')) return;

  const heroCarousel = new HeroCarousel();
  heroCarousel.loadMovies();

  // Add click handlers for buttons
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.hero-btn-play');
    const infoBtn = e.target.closest('.hero-btn-info');

    if (playBtn) {
      const slide = document.querySelector('.hero-slide.active');
      const movieData = slide?.dataset.movieData;
      if (movieData) {
        const movie = JSON.parse(movieData);
        localStorage.setItem('filme', JSON.stringify(movie));
        window.location.href = getHeroPagePath('detalhes');
      }
    }

    if (infoBtn) {
      const slide = document.querySelector('.hero-slide.active');
      const movieData = slide?.dataset.movieData;
      if (movieData) {
        const movie = JSON.parse(movieData);
        localStorage.setItem('filme', JSON.stringify(movie));
        window.location.href = getHeroPagePath('detalhes');
      }
    }
  });
});
