// Main JS for Calico Aquatics
// - Mobile navigation toggle
// - Footer year
// - Contact form validation and submission
// - Gallery lightbox with navigation
// - Scroll-linked reveal for gallery images
// - eBay seller listings rendering via backend proxy
// - Interactive map (Leaflet) on About page
// - Inline Open/Closed status under Opening Hours

(function() {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Contact form handling
  const form = document.getElementById('contact-form');
  if (form) {
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);

      // Basic validation
      let valid = true;
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();

      const setError = (id, msg) => {
        const el = form.querySelector(`.error[data-for="${id}"]`);
        if (el) el.textContent = msg || '';
      };

      setError('name', '');
      setError('email', '');
      setError('message', '');

      if (!name) { setError('name', 'Please enter your name.'); valid = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'Please enter a valid email.'); valid = false; }
      if (!message) { setError('message', 'Please add a message.'); valid = false; }

      if (!valid) return;

      // Send to Formspree
      status.textContent = 'Sending...';
      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        });
        if (resp.ok) {
          status.textContent = 'Thanks! We\'ll be in touch shortly.';
          form.reset();
        } else {
          const err = await resp.json().catch(() => ({}));
          status.textContent = err.errors?.[0]?.message || 'Sorry, there was a problem sending your message.';
        }
      } catch (error) {
        status.textContent = 'Network error. Please try again later.';
      }
    });
  }

  // Gallery lightbox with navigation
  const gallery = document.querySelector('.gallery-grid');
  if (gallery) {
    const galleryImgs = Array.from(gallery.querySelectorAll('img'));
    if (!galleryImgs.length) { /* no images */ }

    // Create reusable lightbox overlay
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close image preview');
    closeBtn.innerHTML = '&times;';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-nav lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous image');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-nav lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next image');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>';

    const img = document.createElement('img');

    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(img);
    overlay.appendChild(nextBtn);
    document.body.appendChild(overlay);

    let prevBodyOverflow = '';
    let currentIndex = -1;

    const setImage = (index) => {
      const el = galleryImgs[index];
      if (!el) return;
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      currentIndex = index;
      // Preload neighbors for smoother nav
      const preload = [index - 1, index + 1].map(i => (i + galleryImgs.length) % galleryImgs.length);
      preload.forEach(i => {
        const p = new Image();
        const src = galleryImgs[i]?.currentSrc || galleryImgs[i]?.src;
        if (src) p.src = src;
      });
    };

    const open = (index) => {
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setImage(index);
      overlay.classList.add('open');
    };
    const close = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = prevBodyOverflow || '';
      currentIndex = -1;
    };
    const showDelta = (d) => {
      if (!galleryImgs.length || currentIndex < 0) return;
      const next = (currentIndex + d + galleryImgs.length) % galleryImgs.length;
      setImage(next);
    };

    gallery.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'IMG') {
        const idx = galleryImgs.indexOf(target);
        if (idx >= 0) open(idx);
      }
    });

    // Close on backdrop click, not when clicking inner controls
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showDelta(-1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showDelta(1); });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape' || e.key === 'Esc') { close(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showDelta(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showDelta(1); }
    });
  }

  // Scroll-linked reveal for gallery images
  (function initScrollLinkedReveal(){
    const imgs = Array.from(document.querySelectorAll('.gallery-grid img'));
    if (!imgs.length) return;
    imgs.forEach((img) => img.classList.add('reveal'));

    let ticking = false;
    const compute = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      imgs.forEach((el) => {
        if (el.classList.contains('reveal-complete')) return;
        const rect = el.getBoundingClientRect();
        const pivot = rect.top + rect.height * 0.3;
        const start = vh * 0.98; // begin reveal near bottom of viewport
        const end = vh * 0.70;   // complete reveal earlier (less scrolling needed)
        let p = 1 - (pivot - end) / (start - end);
        if (pivot <= end) p = 1;
        if (pivot >= start) p = 0;
        p = Math.max(0, Math.min(1, p));
        el.style.setProperty('--reveal-p', String(p));
        if (p >= 1) {
          el.classList.add('reveal-complete');
          el.style.removeProperty('--reveal-p');
        }
      });
      ticking = false;
    };

    const requestCompute = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };

    // Run once and on scroll/resize
    compute();
    window.addEventListener('scroll', requestCompute, { passive: true });
    window.addEventListener('resize', requestCompute);
  })();

  // Used page: Render eBay items via backend proxy (progressive enhancement)
  (function initEbaySellerListings(){
    const mount = document.getElementById('ebay-listings');
    if (!mount) return;
    const seller = mount.getAttribute('data-seller') || 'calicoaquatics';

    const render = (items) => {
      if (!Array.isArray(items) || !items.length) return;
      const heading = document.createElement('div');
      heading.className = 'section-header';
      heading.innerHTML = '<h2>Live eBay Listings</h2><p>Latest items from our eBay store.</p>';

      const grid = document.createElement('div');
      grid.className = 'cards cards-grid-3';

      items.forEach((it) => {
        const a = document.createElement('a');
        a.className = 'card card-link-block';
        a.href = it.url;
        a.target = '_blank';
        a.rel = 'noopener';

        if (it.image) {
          const img = document.createElement('img');
          img.src = it.image;
          img.alt = it.title || 'eBay item';
          img.loading = 'lazy';
          img.className = 'card-img-tall';
          a.appendChild(img);
        }

        const body = document.createElement('div');
        body.className = 'card-body';
        const h3 = document.createElement('h3');
        h3.textContent = it.title || 'Item';
        const p = document.createElement('p');
        const price = it.price ? Number(it.price) : null;
        p.textContent = price != null ? `${price.toFixed(2)} ${it.currency || ''}` : '';
        body.appendChild(h3);
        if (p.textContent) body.appendChild(p);
        a.appendChild(body);

        const wrap = document.createElement('div');
        wrap.className = 'card';
        wrap.appendChild(a);
        grid.appendChild(wrap);
      });

      mount.appendChild(heading);
      mount.appendChild(grid);

      // Hide the fallback iframe if present
      const iframe = document.getElementById('ebay-store-iframe');
      if (iframe) iframe.style.display = 'none';
    };

    fetch(`/api/ebay/seller-items?seller=${encodeURIComponent(seller)}&limit=24`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
      .then(data => render(data.items))
      .catch(() => { /* keep iframe fallback */ });
  })();


  // About: interactive map (Leaflet)
  const mapEl = document.getElementById('map');
  if (mapEl && window.L) {
    let lat = parseFloat(mapEl.getAttribute('data-lat') || '54.5');
    let lng = parseFloat(mapEl.getAttribute('data-lng') || '-3.4');
    const zoom = parseInt(mapEl.getAttribute('data-zoom') || '5', 10);
    const markerLabel = mapEl.getAttribute('data-marker') || 'Our Location';
    const address = (mapEl.getAttribute('data-address') || '').trim();

    const map = L.map(mapEl).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Locked (non-draggable) marker
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(markerLabel);

    // 12-mile callout ring around the pin (12 miles ≈ 19312.1 meters)
    const RADIUS_12_MILES_M = 12 * 1609.344;
    const ring = L.circle([lat, lng], {
      radius: RADIUS_12_MILES_M,
      color: '#FF7A00',
      weight: 2,
      opacity: 0.9,
      fillColor: '#FF7A00',
      fillOpacity: 0.08
    }).addTo(map);

    // Ensure the ring is visible by fitting bounds
    try { map.fitBounds(ring.getBounds(), { padding: [24, 24] }); } catch (_) {}

    // If an address is provided, geocode it to position the map & pin (will still remain locked)
    if (address) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&addressdetails=0&q=${encodeURIComponent(address)}`;
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(r => r.ok ? r.json() : [])
        .then(results => {
          if (Array.isArray(results) && results.length) {
            const item = results[0];
            const nLat = parseFloat(item.lat);
            const nLng = parseFloat(item.lon);
            if (!isNaN(nLat) && !isNaN(nLng)) {
              lat = nLat; lng = nLng;
              map.setView([lat, lng], Math.max(16, zoom));
              marker.setLatLng([lat, lng]).bindPopup(markerLabel);
              if (ring) {
                ring.setLatLng([lat, lng]);
                try { map.fitBounds(ring.getBounds(), { padding: [24, 24] }); } catch (_) {}
              }
            }
          }
        })
        .catch(() => { /* ignore and keep default */ });
    }
  }

  // About: Inline Open/Closed status under Opening Hours (UK time)
  (function renderInlineOpeningStatus(){
    const target = document.getElementById('opening-status');
    if (!target) return;

    const schedule = {
      0: [],                 // Sunday
      1: [[10, 0, 17, 0]],   // Monday 10:00-17:00
      2: [],                 // Tuesday CLOSED
      3: [[10, 0, 17, 0]],   // Wednesday
      4: [[10, 0, 17, 0]],   // Thursday
      5: [[10, 0, 17, 0]],   // Friday
      6: [[10, 0, 17, 0]],   // Saturday
    };

    const getUKTimeParts = () => {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour12: false,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const parts = fmt.formatToParts(new Date());
      const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
      const map = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
      const day = map[obj.weekday] ?? new Date().getDay();
      const minutes = parseInt(obj.hour, 10) * 60 + parseInt(obj.minute, 10);
      return { day, minutes };
    };

    const { day, minutes } = getUKTimeParts();
    const intervals = schedule[day] || [];
    const isOpen = intervals.some(([sh, sm, eh, em]) => {
      const start = sh * 60 + sm;
      const end = eh * 60 + em; // end-exclusive
      return minutes >= start && minutes < end;
    });

    const chip = document.createElement('span');
    chip.className = `status-chip ${isOpen ? 'open' : 'closed'}`;
    const dot = document.createElement('span');
    dot.className = 'dot';
    const text = document.createElement('span');
    text.textContent = isOpen ? 'Open now' : 'Closed';

    chip.appendChild(dot);
    chip.appendChild(text);
    target.innerHTML = '';
    target.appendChild(chip);
  })();
})();
