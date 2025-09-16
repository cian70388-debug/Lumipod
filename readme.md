# Key‑in (PWA)
A lightweight, installable AI chat app that runs as a Progressive Web App. Works offline with a local helper, and can use cloud AI if you paste your API key in **Settings**.

## 1) One‑step deploy (Netlify Drop)
- Download the ZIP from ChatGPT.
- Go to **app.netlify.com/drop** and drop the ZIP. That’s it. Netlify gives you a live URL.
- Optional: Click **Enable HTTPS** and set a custom subdomain.

## 2) Local install
- Unzip and open `index.html` in your mobile browser.
- Add to Home Screen (you’ll see the install prompt), then use offline.

## 3) Cloud AI (optional)
- In Settings, paste your **OpenAI API key** and pick a model.
- Your key is stored locally in your browser only.

> Push notifications require a server (Web Push). This starter ships **local notifications** while the app is open. If you want FCM/OneSignal later, add their SDK and keys.

## Structure
- `index.html` — UI + Tailwind (CDN)
- `js/app.js` — chat logic, API integration
- `service-worker.js` — offline cache
- `manifest.json` — PWA metadata
- `assets/icons/` — app icons
- `netlify.toml` — safe headers + SPA fallback

Enjoy!
