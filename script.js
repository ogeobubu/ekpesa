/**
 * Performance and Service Worker Management for Ekpesa Kingdom Website
 * Advanced optimization for lightning-fast loading
 */

// ================================
// PERFORMANCE MONITORING
// ================================

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.init();
  }

  init() {
    // Measure Core Web Vitals
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    
    // Measure other performance metrics
    this.measureLoadTimes();
    
    // Report metrics (can be sent to analytics)
    this.reportMetrics();
  }

  measureLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({entryTypes: ['largest-contentful-paint']});
  }

  measureFID() {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics.fid = entry.processingStart - entry.startTime;
      }
    }).observe({entryTypes: ['first-input']});
  }

  measureCLS() {
    let clsScore = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      this.metrics.cls = clsScore;
    }).observe({entryTypes: ['layout-shift']});
  }

  measureLoadTimes() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        this.metrics.loadComplete = timing.loadEventEnd - timing.loadEventStart;
        this.metrics.totalLoadTime = timing.loadEventEnd - timing.navigationStart;
      }, 0);
    });
  }

  reportMetrics() {
    setTimeout(() => {
      console.group('🚀 Ekpesa Kingdom Performance Metrics');
      console.log('Largest Contentful Paint (LCP):', Math.round(this.metrics.lcp || 0), 'ms');
      console.log('First Input Delay (FID):', Math.round(this.metrics.fid || 0), 'ms');
      console.log('Cumulative Layout Shift (CLS):', (this.metrics.cls || 0).toFixed(4));
      console.log('DOM Content Loaded:', Math.round(this.metrics.domContentLoaded || 0), 'ms');
      console.log('Load Complete:', Math.round(this.metrics.loadComplete || 0), 'ms');
      console.log('Total Load Time:', Math.round(this.metrics.totalLoadTime || 0), 'ms');
      console.groupEnd();
    }, 2000);
  }
}

// ================================
// SERVICE WORKER REGISTRATION
// ================================

class ServiceWorkerManager {
  constructor() {
    this.swRegistration = null;
    this.updateAvailable = false;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupUpdateHandling();
        console.log('✅ Ekpesa Kingdom SW: Service Worker registered successfully');
      } catch (error) {
        console.warn('⚠️ Ekpesa Kingdom SW: Service Worker registration failed:', error);
      }
    } else {
      console.log('ℹ️ Ekpesa Kingdom SW: Service Workers not supported in this browser');
    }
  }

  async registerServiceWorker() {
    this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // Handle service worker updates
    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      }
    });

    return this.swRegistration;
  }

  setupUpdateHandling() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        this.updateAvailable = true;
        this.showUpdateNotification();
      }
    });
  }

  showUpdateNotification() {
    // Create update notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: var(--accent); color: var(--primary); padding: 12px; text-align: center; z-index: 10000; font-weight: 600;">
        📱 New version available! <button onclick="location.reload()" style="margin-left: 10px; padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Update</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
  }

  async updateServiceWorker() {
    if (this.swRegistration && this.updateAvailable) {
      await this.swRegistration.update();
      this.updateAvailable = false;
    }
  }
}

// ================================
// ADVANCED LAZY LOADING
// ================================

class AdvancedLazyLoader {
  constructor() {
    this.imageObserver = null;
    this.videoObserver = null;
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.lazyLoadImages();
    this.lazyLoadVideos();
  }

  setupIntersectionObserver() {
    // Image observer for progressive loading
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.01
    });

    // Video observer for smart loading
    this.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadVideo(entry.target);
          this.videoObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.25
    });
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      // Add progressive loading class
      img.classList.add('lazy-loading');
      
      // Replace src with data-src for lazy loading
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
      
      // Create placeholder while loading
      this.createImagePlaceholder(img);
      
      // Observe image
      this.imageObserver.observe(img);
    });
  }

  lazyLoadVideos() {
    const videos = document.querySelectorAll('video[loading="lazy"]');
    videos.forEach(video => {
      this.videoObserver.observe(video);
    });
  }

  createImagePlaceholder(img) {
    img.style.transition = 'opacity 0.3s ease';
    img.style.opacity = '0';
    
    img.addEventListener('load', () => {
      img.style.opacity = '1';
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
    });
  }

  loadImage(img) {
    if (img.dataset.src) {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      };
      tempImg.src = img.dataset.src;
    }
  }

  loadVideo(video) {
    if (video.dataset.src) {
      const source = video.querySelector('source');
      if (source) {
        source.src = video.dataset.src;
        video.load();
        video.removeAttribute('data-src');
      }
    }
  }
}

// ================================
// GOOGLE MAPS INITIALIZATION
// ================================

function initMap() {
  // Coordinates for Ekpesa Kingdom, Akoko-Edo, Edo State, Nigeria
  const ekpesaLocation = { lat: 5.8, lng: 5.2 };
  
  // Map options
  const mapOptions = {
    zoom: 10,
    center: ekpesaLocation,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true
  };

  const map = new google.maps.Map(document.getElementById('google-map'), mapOptions);

  const marker = new google.maps.Marker({
    position: ekpesaLocation,
    map: map,
    title: 'Ekpesa Kingdom',
    icon: {
      url: 'assets/favicon.png',
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 32)
    }
  });

  const infoWindowContent = `
    <div style="padding: 8px; font-family: var(--sans); max-width: 250px;">
      <h3 style="color: #083b2b; margin: 0 0 8px 0; font-size: 16px;">Ekpesa Kingdom</h3>
      <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.4;">
        <strong>Location:</strong> Akoko-Edo, Edo State, Nigeria
      </p>
      <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.4;">
        <strong>Coordinates:</strong> 5.8°N, 5.2°E
      </p>
      <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.4;">
        <strong>Region:</strong> Okpameri Land
      </p>
      <p style="margin: 0; font-size: 13px; font-style: italic; color: #666;">
        The Land of Upright People
      </p>
    </div>
  `;

  const infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent
  });

  marker.addEventListener('click', () => {
    infoWindow.open(map, marker);
  });

  infoWindow.open(map, marker);
}

// ================================
// MAIN APPLICATION INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize performance monitoring
  const performanceMonitor = new PerformanceMonitor();
  
  // Initialize Service Worker manager
  const swManager = new ServiceWorkerManager();
  
  // Initialize advanced lazy loading
  const lazyLoader = new AdvancedLazyLoader();

  // Enhanced mobile menu functionality
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('primaryMenu');

  if (menuBtn && menu) {
    // Mobile menu toggle
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        menu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Enhanced smooth scroll for same-page links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Scroll-based active navigation highlighting
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.menu a[href^="#"]');

  function highlightActiveNav() {
    let current = '';
    const scrollPos = window.pageYOffset + 150;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', highlightActiveNav);
  highlightActiveNav();

  // Live search functionality
  const search = document.getElementById('siteSearch');
  const sectionsToSearch = Array.from(document.querySelectorAll('article .section'));

  function normalize(s){ return s.toLowerCase().replace(/\s+/g,' ').trim(); }

  if (search) {
    search.addEventListener('input', () => {
      const q = normalize(search.value);
      sectionsToSearch.forEach(sec => {
        const text = normalize(sec.textContent || '');
        if (!q || text.includes(q)) {
          sec.style.display = '';
          sec.classList.remove('faded');
        } else {
          sec.style.display = 'none';
        }
      });
    });
  }

  // Preload critical resources
  const criticalImages = ['assets/hero.jpg', 'assets/palace.jpg'];
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
});

// ================================
// ERROR HANDLING
// ================================

window.addEventListener('error', (e) => {
  console.error('Ekpesa Kingdom Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Ekpesa Kingdom Promise Rejection:', e.reason);
});
