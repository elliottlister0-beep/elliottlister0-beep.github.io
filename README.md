# Modern Responsive Business Website

A professional, mobile-friendly website for **Calico Aquatics** built with HTML5, CSS3, and JavaScript. It includes Home, About, Services, and Contact pages with a responsive navigation bar, hero section, services cards, testimonials, and a contact form.

## Structure
- `index.html` — Home page
- `about.html` — About page
- `services.html` — Services page
- `contact.html` — Contact page
- `used.html` — Used tanks & coral (with eBay integration)
- `css/style.css` — Global styles (black/white/orange theme)
- `js/main.js` — Interactivity (mobile nav, footer year, form validation, gallery, eBay render)
- `images/` — Placeholder images (add your own here)

## Run Locally (static only)
Open `index.html` directly in your browser, or start a simple local server:

```zsh
# Option A: Python (macOS ships with Python 3)
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser

# Option B: Node (if installed)
npx serve . -p 8080
```

## eBay API (optional dynamic listings)
This repo includes a tiny Node/Express backend to proxy the eBay Finding API so we can show live listings on `used.html` without exposing keys in the browser. The page falls back to an embedded store iframe if the API isn’t available.

Setup:

1. Copy `.env.example` to `.env` and set your eBay App ID:
	- `EBAY_APP_ID=your_app_id_here`
2. Install dependencies and run the server:

```zsh
cd "Calico Aquatics Website"
npm install
npm start
```

Then open: http://localhost:3000/used.html

How it works:
- Backend: `server/server.js` exposes `/api/ebay/seller-items?seller=calicoaquatics&limit=24` which calls eBay Finding API `findItemsAdvanced` (Seller filter) and returns simplified JSON.
- Frontend: `js/main.js` fetches that endpoint and renders cards into the `#ebay-listings` mount. If it fails, the `#ebay-store-iframe` remains visible.

Notes:
- Only the eBay App ID (Client ID) is required for Finding API; OAuth is not needed here.
- Deployments must run the Node server (serving static files and the API on the same origin).
