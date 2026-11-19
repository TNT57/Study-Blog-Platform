import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy (CSP): the browser's list of what this site may load and run.
 * If an attacker ever slips HTML into a page, the browser still refuses anything not on this list.
 *
 * Our choice (the trade-off is in docs/learn/07-xss.md): Next.js streams the parts of a page
 * inside <Suspense> with small INLINE scripts, so scripts need 'unsafe-inline'. A stricter policy
 * needs a new nonce on every request, which makes every page dynamic and gives up our fast static
 * shells. We tested strict + SRI: 9 inline scripts were blocked and the page never finished loading.
 */
const contentSecurityPolicy = [
  "default-src 'self'", // anything not listed below: only from our own site
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // no scripts from other sites
  "style-src 'self' 'unsafe-inline'", // React style={{...}} attributes (the chart bars)
  "img-src 'self' data: blob:",
  "font-src 'self'", // next/font serves the fonts from our own site
  "object-src 'none'", // no plugins (Flash, Java...)
  "base-uri 'self'", // an injected <base> can't send our links somewhere else
  "form-action 'self'", // forms can only send to us (a stolen form can't post your data elsewhere)
  "frame-ancestors 'none'", // no other site may show our pages in an iframe (clickjacking)
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Browsers must trust our Content-Type, never "guess" that a text file is a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only "study-blog-platform.vercel.app", never the full address you came from.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We never need these, so nobody (not even an injected script) can ask for them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Older browsers' version of frame-ancestors 'none'.
  { key: "X-Frame-Options", value: "DENY" },
  // Always https for 2 years (browsers ignore it on http://localhost).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Turns on forbidden() and the forbidden.tsx page (a 403). Still experimental in Next.js 16.
    authInterrupts: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
