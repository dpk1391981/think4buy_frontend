/** @type {import('next').NextConfig} */

// NEXT_PUBLIC_API_URL is the frontend URL (used for CSP frame-ancestors, not backend calls).
// NEXT_PUBLIC_API_BASE_URL is the backend origin — include it in connect-src so the BFF
// can forward requests and the browser can reach proxied API responses.
const _apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
let _appOrigin = 'http://localhost:3000';
try { _appOrigin = new URL(_apiUrl).origin; } catch {}

const _backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
let _apiOrigin = 'http://localhost:3001';
try { _apiOrigin = new URL(_backendBaseUrl).origin; } catch {}

const nextConfig = {
  // ─── Image Optimization ──────────────────────────────────────────────────
  images: {
    // Modern formats: browser picks best supported (AVIF > WebP > original)
    formats: ['image/avif', 'image/webp'],
    // Device breakpoints for responsive srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],
    // Aggressive in-memory cache for CDN-served images (10 mins TTL via s-maxage)
    minimumCacheTTL: 60 * 60 * 24, // 24 hours on CDN edge
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Local dev backend
      { protocol: 'http',  hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      // Self-hosted uploads (any subdomain of think4buysale.com)
      { protocol: 'https', hostname: '*.think4buysale.com' },
      { protocol: 'https', hostname: 'think4buysale.com' },
      // API server (vtechxhub hosted backend)
      { protocol: 'https', hostname: 'reales-api.vtechxhub.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.vtechxhub.com', pathname: '/uploads/**' },
      // S3 storage — all regions and bucket-hosted URLs
      // e.g. https://my-bucket.s3.ap-south-1.amazonaws.com/...
      { protocol: 'https', hostname: '**.amazonaws.com' },
      // S3 path-style: https://s3.region.amazonaws.com/bucket/...
      { protocol: 'https', hostname: 's3.*.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.imagekit.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Wildcard for migration flexibility (tighten in production if using fixed CDN)
      { protocol: 'https', hostname: '**', pathname: '/uploads/**' },
    ],
  },

  // ─── Compiler ────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production builds (keep warn/error)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['warn', 'error'] }
      : false,
  },

  // ─── Output ──────────────────────────────────────────────────────────────
  // Enable gzip/brotli compression at Next.js level (disable if handled by nginx/CDN)
  compress: true,

  // Standalone output required by Dockerfile — bundles server.js + node_modules
  output: 'standalone',

  // ─── Experimental ────────────────────────────────────────────────────────
  experimental: {
    // Opt in to PPR (Partial Pre-rendering) when available — allows static shell
    // + dynamic holes without a full SSR round-trip
    // ppr: true, // uncomment once on Next.js 15+

    // Optimise CSS delivery (fewer unused selectors shipped)
    optimizeCss: false, // set true after installing 'critters' package

    // Keep Node.js-only packages out of the client bundle
    serverComponentsExternalPackages: ['redis'],
  },

  // ─── Headers ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Aggressive caching for static assets served from /_next/static/
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Fonts: long-lived cache
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // All HTML pages — comprehensive security headers
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options',         value: 'DENY' },
          // Legacy XSS filter (Chrome removed, but IE/Edge still benefit)
          { key: 'X-XSS-Protection',        value: '1; mode=block' },
          // Limit referrer information on cross-origin requests
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by a real estate portal
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()' },
          // HTTP Strict Transport Security — 2 years, include subdomains, preload
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline (nonce approach needed for full CSP; use unsafe-inline during migration)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Styles: self + inline (Tailwind generates inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: self + data URIs + CDN sources
              "img-src 'self' data: blob: https: http://localhost:3001",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // API calls: self (BFF proxy) + backend origin (for direct static/CDN requests)
              `connect-src 'self' ${_appOrigin} ${_apiOrigin} ws: wss:`,
              // No plugins
              "object-src 'none'",
              // iframes (maps)
              "frame-src 'self' https://maps.google.com https://www.google.com https://maps.googleapis.com",
              // Workers
              "worker-src 'self' blob:",
              // Upgrade HTTP to HTTPS
              ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
            ].join('; '),
          },
          // Cross-origin isolation headers (required for SharedArrayBuffer)
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },

  // ─── Rewrites ────────────────────────────────────────────────────────────
  // NOTE: No direct rewrite to backend. All API calls go through the
  // internal route handler at /api/q/[...slug] which adds BFF authentication.
  // The backend URL is a server-side-only env var (BACKEND_INTERNAL_URL).
  async rewrites() {
    return [];
  },

  // ─── Redirects ───────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Trailing slash normalisation
      { source: '/properties/', destination: '/properties', permanent: true },
      { source: '/agents/',     destination: '/agents',     permanent: true },
    ];
  },
};

module.exports = nextConfig;
