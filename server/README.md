# BAMCO technical-review API

The management card is currently a visual demo at the owner’s request. Its button performs no action, has no connection settings, and sends no data. The API implementation below is retained for future activation and is not loaded by the management page. The implementation is ready; a live AI connection still requires an HTTPS server, an OpenAI project API key with credit, and an enabled model supporting Structured Outputs. Nothing calls OpenAI automatically, and no simulated report is presented as AI output.

GitHub Pages serves static files and does not run this Node service. Deploy `server/ai-review.mjs` and the sibling `ai-review-core.js` on a Node 22+ server behind an HTTPS reverse proxy. Do not serve environment files as static files.

1. On that server, copy `server/.env.example` to a private `.env` outside the public site directory.
2. Set `OPENAI_API_KEY` and `OPENAI_MODEL` to your project's key and an available model supporting Responses structured outputs. No model or billing account is silently selected.
3. Set `BAMCO_AI_ACCESS_TOKEN` to a cryptographically random value of at least 32 characters. This is a separate service credential, **not** the provider API key and **not** the static website's login password. Generate it with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` on the server.
4. Keep `BAMCO_ALLOWED_ORIGINS=https://nazanin-ghaemizadeh.github.io`. Configure TLS and forward `/api/technical-review` to the service. The default bind address is loopback; for a managed container behind TLS, set `BAMCO_BIND_HOST=0.0.0.0` in its private environment.
5. Run `node --env-file=/absolute/private/path/.env server/ai-review.mjs` under the server's process manager. The process serves only the API route, not website files.
6. In management → **AI Technical Review** → **AI connection settings**, enter the full HTTPS URL ending in `/api/technical-review` and the separate access token, then save. Only the URL persists on the device. Enter the service token again after a reload; the provider key must never be entered in the browser.

The existing website login is client-side and cannot authenticate a paid backend securely. This service therefore checks its separate bearer credential on every request. CORS is an additional restriction, not authentication. Restrict token distribution to managers and rotate it in the server environment when needed. For multiple managers requiring individual revocation, replace this shared service credential with server-verified organizational identity before extending access.

The service sends only a whitelisted payload: vehicle make/model/date/odometer, scores, active criterion weights, item descriptions, notes, and final evaluator/expert comments. It excludes photos, contact fields, login identity, and entry-window reference/specification choices. Text notes are sent as entered. `store:false` disables application-state storage for the Responses request; this does not promise zero provider retention.

Responses are validated and evidence links must reference real input item IDs. The browser renders all response text with `textContent`, does not change the assessment, and discards results when the assessment changes. Missing scores remain null. The output distinguishes hypotheses, test plans and missing evidence from measured facts and certification. Hazardous tests are assigned to qualified facilities.

Limits: 512 KiB request body, 500 items, 2 concurrent requests, 6 authenticated requests per minute per process, and a 90-second provider timeout. Run one instance with these limits or add a shared authenticated rate limiter for multiple replicas. Configure spending limits on the provider project. Server errors return bounded error codes without upstream bodies or keys.

Run verification with `node --test tests/ai-review.test.mjs`. These tests use a mock provider and incur no AI charges. A real provider request must be checked after deployment and configuration; it has not been verified merely by passing these tests.

API contract: see `ai-review-core.js`. Implementation follows the official [Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs), using the Responses `text.format` JSON schema and explicit refusal/incomplete-response handling.
