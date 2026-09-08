# RN Mall Mobile Application Design

## Goal

Build a React Native mobile application that reproduces the user-facing Nuxt Pilot mall flow: featured home page, searchable product catalog, product detail, email/password login, and protected account profile. A dedicated mobile API service under this repository's `backend/` directory will serve the app through `https://api.rn-mall.com/mobile/v1`.

The first release is a self-contained demonstration environment. It uses the same six demo products and one demo user as the Nuxt project. It does not connect to a production identity provider, database, order system, cart, or payment service.

## Non-goals

- Changing the Nuxt application, its Koa backend, its Web BFF, or its Cookie session behavior.
- Exposing the Nuxt BFF service token or its HMAC signing secret to a mobile client.
- Implementing cart persistence, favorites, checkout, payment, registration, password recovery, or remote product administration.
- Adding third-party runtime or test dependencies.

## Target architecture

```text
React Native app
  | HTTPS + Bearer access token
  v
https://api.rn-mall.com/mobile/v1
  | reverse proxy terminates TLS and forwards privately
  v
current repository: backend/ Node HTTP service
  | in-memory demo sessions and copied demo catalog
  v
JSON response: { data, traceId }

Nuxt Web app -> Nuxt /api BFF -> Nuxt Koa backend
```

The mobile API is intentionally separate from the Nuxt Web BFF. Web uses an httpOnly Cookie plus CSRF protection and service-to-service HMAC authentication. The mobile app uses short-lived Bearer access tokens and stored refresh tokens. These trust models must not be mixed.

## Deployment and domain boundary

Production mobile requests use the exact base URL `https://api.rn-mall.com/mobile/v1`.

The Node service listens on a private interface and port, defaulting to `127.0.0.1:4000`. A reverse proxy or managed load balancer owns the public DNS record and TLS certificate for `api.rn-mall.com`, forwards only the required paths to the process, sets `X-Forwarded-For` and `X-Forwarded-Proto`, and enforces an HTTPS redirect at the edge.

Development runs the service locally. Native-device testing requires an HTTPS tunnel or a LAN-reachable development address; a phone cannot use its own `127.0.0.1` to reach the developer machine. The React Native configuration change that points the app at the mobile base URL is deferred to the frontend integration phase, so existing real environment files remain untouched during backend work.

## Mobile API contract

Every successful response is `200` and has this shape:

```json
{ "data": {}, "traceId": "request-id" }
```

Every expected failure has a matching HTTP status and this shape:

```json
{ "code": "UNAUTHORIZED", "message": "...", "traceId": "request-id" }
```

The allowed error codes are `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, and `INTERNAL_ERROR`. Error details are never returned in production.

### Health

`GET /health` returns `{ data: { ok: true, service: "rn-mall-mobile-api" }, traceId }`. It is for infrastructure health checks only and does not disclose configuration or user data.

### Authentication

`POST /mobile/v1/auth/login`

Request:

```json
{ "email": "demo@example.com", "password": "nuxt-demo" }
```

Success data contains `accessToken`, `refreshToken`, and the public user profile. Invalid credentials deliberately return the same `401 UNAUTHORIZED` response regardless of whether the email is known.

`POST /mobile/v1/auth/refresh`

Request:

```json
{ "refreshToken": "opaque-token" }
```

Success returns a newly minted access token, a replacement refresh token, and the user profile. Refresh tokens rotate: the old token becomes unusable before the response is returned.

`GET /mobile/v1/auth/me` requires `Authorization: Bearer <accessToken>` and returns the public user profile.

`POST /mobile/v1/auth/logout` requires the same Bearer token and returns `{ ok: true }`. It invalidates the active server-side session, including the refresh token. Any previously issued access token for the session fails thereafter.

### Products

`GET /mobile/v1/products?q=&category=&featured=` is public. `q` searches product name, series, category, and summary case-insensitively. `category` is an exact category. `featured=true` returns only featured products. Invalid `featured` values return `422 VALIDATION_ERROR`.

`GET /mobile/v1/products/:slug` is public and returns the detail product payload. Missing products return `404 NOT_FOUND`.

Product summaries and detail payloads match the Nuxt shapes exactly. The mobile service begins with a versioned copy of the Nuxt demo catalog. Moving both projects to a shared package or a real catalog service becomes necessary only once demo data becomes mutable.

## Token and session design

Access tokens are signed, compact HMAC-SHA-256 tokens with `sub`, `sid`, `kind: "access"`, and an expiry of 15 minutes. The signing key is `MOBILE_API_TOKEN_SECRET`; production refuses to start without a suitably long secret.

Refresh tokens are 32-byte opaque random values with a 30-day expiry. The service stores only their SHA-256 digest alongside the session ID, user ID, and expiry. Sessions remain in memory for this demo release. A restart intentionally logs users out because the session map is cleared. That limitation is explicit and will be replaced by a persistent session store before a real-user release.

The React Native app keeps the access token in Zustand memory and the refresh token in the existing SecureStore wrapper. It sends only the access token as a Bearer token. It must never store passwords, service credentials, or the token signing secret.

## Server safeguards

- Require JSON for request bodies and cap a parsed body at 16 KiB.
- Generate a UUID trace ID unless a valid inbound request ID is supplied; return it in the response header and payload.
- Apply safe baseline response headers: `X-Content-Type-Options`, `Referrer-Policy`, `Cache-Control: no-store` for auth responses, and a restrictive permissions policy.
- Rate-limit login attempts in memory by source address to five attempts per 15 minutes. For a reverse-proxy deployment, source extraction trusts forwarded headers only when `TRUST_PROXY=true` is explicitly configured.
- Do not log Authorization headers, refresh tokens, passwords, or response bodies containing tokens.
- Parse only the explicit methods and routes listed above. Reply with `404 NOT_FOUND` for unrecognized routes and `405` with `Allow` when a known route receives an unsupported method.
- CORS is not needed for native apps. Browser origins are denied by default; if Expo Web support is intentionally introduced later, allowed origins will be configured explicitly rather than using `*`.

## React Native application design

The existing Expo Router project remains feature-oriented.

- `auth` is adapted from the current unrelated phone/OAuth workflow to the mobile API's email/password flow. The existing access-token-in-memory and refresh-token-in-SecureStore lifecycle is retained.
- `products` owns API calls, types, catalog query state, product cards, catalog screen, and detail screen.
- `home` shows the Nuxt featured-products hero content adapted to native layout and a featured product list.
- `profile` renders the Nuxt account data and logout action behind the existing protected route mechanism.
- Expo Router provides a protected application area with Home, Products, Product Detail, and Profile routes. Native navigation replaces Nuxt header/footer and SSR-specific route concerns.
- All product fetching is client-side. Nuxt SSR, SEO meta tags, and server route cache rules have no React Native equivalent and are intentionally not reproduced.

The first native UI reproduces information architecture and interaction behavior, not pixel-identical Web CSS. Product image URLs remain remote Unsplash URLs; image loading and error states are handled natively.

## File ownership

Backend work will live entirely in `backend/` with focused modules for HTTP routing, response writing, request validation, token/session management, rate limiting, demo data, and tests. `package.json` receives only scripts for running and testing the Node-native service; no dependency is added.

Frontend work uses `src/features/auth`, `src/features/products`, `src/features/home`, `src/features/profile`, and lightweight Expo Router route composition under `app/`. Shared API transport changes remain limited to the explicitly authorized authentication migration; the existing SecureStore key and storage medium are not changed.

## Verification and acceptance criteria

Backend tests use Node's built-in test runner and cover successful and rejected login, login rate limiting, refresh rotation, invalidated logout sessions, authenticated profile reads, product filters, product detail/not-found behavior, error envelopes, and token-free logs.

The React Native verification phase covers cold-start session restoration, expired access-token refresh and retry, logout, protected-route redirects, featured catalog load, filtering, detail navigation, and failure/retry states. It runs the repository type check, lint, formatter check, and relevant backend tests. Real-device verification uses a valid HTTPS `api.rn-mall.com` deployment or tunnel.

## Delivery sequence

1. Establish and test the standalone mobile API, including deployment configuration documentation for `api.rn-mall.com`.
2. Replace the app's unrelated auth request contract while preserving SecureStore-based refresh-token handling.
3. Implement catalog, detail, home, and profile features against the mobile API.
4. Verify native navigation, session lifecycle, API errors, and a deployed HTTPS endpoint.
