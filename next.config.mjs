import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */

// Validate required environment variables at build/startup time
const requiredEnvVars = ["TMDB_API_KEY"];
const requiredProdEnvVars = ["SESSION_SECRET"];

// Check required vars (skip during build if not available)
if (
  process.env.NODE_ENV === "production" ||
  process.env.npm_lifecycle_event === "start"
) {
  const missing = [...requiredEnvVars, ...requiredProdEnvVars].filter(
    (key) => !process.env[key],
  );
  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error("Please set these in your .env file or environment.\n");
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }
  }
}

const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Webpack configuration (required for Sentry compatibility)
  webpack: (config, { isServer }) => {
    // Return unmodified config - Sentry will add its own modifications
    return config;
  },

  // Optimize production builds
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Enable gzip compression
  compress: true,

  // Optimize package imports
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "vidsrc.me",
      },
      {
        protocol: "https",
        hostname: "vidsrc-embed.ru",
      },
    ],
    // Optimize image formats
    formats: ["image/avif", "image/webp"],
    // Reduce image sizes for faster loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Add security and caching headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Allow fullscreen in cross-origin video embeds
            // Syntax: feature=(allowlist) - (*) allows all origins, (self) allows same origin, () denies
            value:
              "camera=(), microphone=(), geolocation=(), fullscreen=(*), display-capture=(*)",
          },
          {
            key: "Content-Security-Policy",
            // Note: 'unsafe-inline' needed for Next.js style injection, 'unsafe-eval' for Next.js dev mode
            // Cloudflare Insights script allowed for analytics (wildcard for subdomains)
            value:
              process.env.NODE_ENV === "production"
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://image.tmdb.org data:; connect-src 'self' https://api.themoviedb.org https://cloudflareinsights.com https://*.cloudflareinsights.com; frame-src 'self' https://vidsrc.me https://*.vidsrc.me https://vidsrc.to https://*.vidsrc.to https://vidsrcme.ru https://*.vidsrcme.ru https://vidsrcme.su https://*.vidsrcme.su https://vidsrc-embed.me https://*.vidsrc-embed.me https://vidsrc-embed.ru https://*.vidsrc-embed.ru https://vidsrc-embed.su https://*.vidsrc-embed.su https://vsrc.su https://*.vsrc.su https://vidsrc.cc https://*.vidsrc.cc https://vidsrc.pro https://*.vidsrc.pro https://moviesapi.club https://*.moviesapi.club https://embed.su https://*.embed.su https://autoembed.cc https://*.autoembed.cc https://multiembed.mov https://*.multiembed.mov https://2embed.cc https://*.2embed.cc https://streamsrc.cc https://*.streamsrc.cc; font-src 'self' data:; base-uri 'self'; form-action 'self';"
                : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://image.tmdb.org data:; connect-src 'self' https://api.themoviedb.org https://cloudflareinsights.com https://*.cloudflareinsights.com; frame-src 'self' https://vidsrc.me https://*.vidsrc.me https://vidsrc.to https://*.vidsrc.to https://vidsrcme.ru https://*.vidsrcme.ru https://vidsrcme.su https://*.vidsrcme.su https://vidsrc-embed.me https://*.vidsrc-embed.me https://vidsrc-embed.ru https://*.vidsrc-embed.ru https://vidsrc-embed.su https://*.vidsrc-embed.su https://vsrc.su https://*.vsrc.su https://vidsrc.cc https://*.vidsrc.cc https://vidsrc.pro https://*.vidsrc.pro https://moviesapi.club https://*.moviesapi.club https://embed.su https://*.embed.su https://autoembed.cc https://*.autoembed.cc https://multiembed.mov https://*.multiembed.mov https://2embed.cc https://*.2embed.cc https://streamsrc.cc https://*.streamsrc.cc; font-src 'self' data:;",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // HSTS - only in production with HTTPS
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        // Cache static assets
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|gif|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache API responses for browsing
        source: "/api/(trending|popular|browse)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },

  // Optimize redirects
  poweredByHeader: false,
};

// Wrap config with Sentry
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#extend-nextjs-configuration

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
