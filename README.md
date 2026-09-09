# BAMCO Vehicle Assessment

سامانه ارزیابی خودرو — نسخه وب مستقر روی GitHub Pages.

## Deployment architecture

- `main` شاخه مرجع توسعه است.
- هر Push روی `main` به‌صورت خودکار با Workflow به `gh-pages` همگام می‌شود.
- `index.html` پوسته کامل و مستقیم برنامه است؛ بنابراین صفحه ورود بدون انتقال میانی نمایش داده می‌شود.
- `app.html` در دوره گذار برای سازگاری با سرویس‌ورکرهای قدیمی همگام با `index.html` نگه داشته می‌شود.
- `sw.js` پیمایش‌ها، JavaScript و CSS را با `no-store` دریافت می‌کند تا تغییرات جدید به نسخه کش‌شده مرورگر گیر نکنند.
- تغییرات رابط/منطق باید در `app.html`، `scripts-*.js` و `styles-*.css` اعمال شوند؛ Workflow انتشار را انجام می‌دهد.

Deployment architecture: single-shell cache-safe v2 — 2026-09-10
