/*
  Simple server to serve the static site and proxy eBay Finding API.
  Uses App ID (EBAY_APP_ID) only — no OAuth needed.
*/

const path = require('path');
const express = require('express');
const compression = require('compression');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use node-fetch v2 style
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(compression());

// Serve the static site from repo root
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot, { extensions: ['html'] }));

// Minimal JSON helper
const json = (res, status, data) => {
  res.status(status).type('application/json').send(JSON.stringify(data));
};

// GET /api/ebay/seller-items?seller=calicoaquatics&limit=24
app.get('/api/ebay/seller-items', async (req, res) => {
  try {
    const appId = process.env.EBAY_APP_ID;
    if (!appId) return json(res, 500, { error: 'Missing EBAY_APP_ID in environment' });

    const seller = String(req.query.seller || '').trim();
    if (!seller) return json(res, 400, { error: 'Missing seller query parameter' });

    const limit = Math.min(Math.max(parseInt(req.query.limit || '24', 10), 1), 50);

    // eBay Finding API - findItemsAdvanced with Seller filter
    // Docs: https://developer.ebay.com/devzone/finding/callref/findItemsAdvanced.html
    const base = 'https://svcs.ebay.com/services/search/FindingService/v1';
    const params = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': 'true',
      'paginationInput.entriesPerPage': String(limit),
      'sortOrder': 'StartTimeNewest',
      // itemFilter(0).name=Seller&itemFilter(0).value=<seller>
      'itemFilter(0).name': 'Seller',
      'itemFilter(0).value': seller,
    });

    const url = `${base}?${params.toString()}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return json(res, 502, { error: `eBay API error: ${resp.status}` });
    const data = await resp.json();

    const root = data && data.findItemsAdvancedResponse && data.findItemsAdvancedResponse[0];
    const items = (root && root.searchResult && root.searchResult[0] && root.searchResult[0].item) || [];

    const simplified = items.map((it) => {
      const id = it.itemId?.[0];
      const title = it.title?.[0];
      const viewUrl = it.viewItemURL?.[0];
      const price = it.sellingStatus?.[0]?.currentPrice?.[0]?.__value__;
      const currency = it.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'];
      const galleryUrl = it.galleryURL?.[0];
      const location = it.location?.[0];
      const condition = it.condition?.[0]?.conditionDisplayName?.[0];
      const listingType = it.listingInfo?.[0]?.listingType?.[0];
      return { id, title, url: viewUrl, price, currency, image: galleryUrl, location, condition, listingType };
    }).filter(x => x && x.id && x.url);

    return json(res, 200, { seller, count: simplified.length, items: simplified });
  } catch (err) {
    return json(res, 500, { error: 'Server error', details: String(err && err.message || err) });
  }
});

// Fallback to serve static files directly if route not found
app.get('*', (req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Calico Aquatics server running at http://localhost:${PORT}`);
});
