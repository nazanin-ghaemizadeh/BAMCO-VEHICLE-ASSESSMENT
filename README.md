# BAMCO Vehicle Assessment

سامانه ارزیابی خودرو — نسخه وب مستقر روی GitHub Pages.

## Deployment architecture

- `main` شاخه مرجع توسعه است.
- هر Push روی `main` به‌صورت خودکار با Workflow به `gh-pages` همگام می‌شود.
- `index.html` فقط Bootstrap انتشار است و نباید رابط اصلی سامانه داخل آن توسعه داده شود.
- رابط اصلی سامانه در `app.html` قرار دارد.
- `sw.js` فایل‌های `app.html`، JavaScript و CSS را با `no-store` دریافت می‌کند تا تغییرات جدید به نسخه کش‌شده مرورگر گیر نکنند.
- تغییرات رابط/منطق باید در `app.html`، `scripts-*.js` و `styles-*.css` اعمال شوند؛ Workflow انتشار را انجام می‌دهد.

Deployment architecture: cache-safe infrastructure v1 — 2026-09-09
