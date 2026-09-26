/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // A baseline Content-Security-Policy. There was none at all.
      //
      // Deliberately limited to directives that cannot break a page: no
      // script-src or style-src, which on this app would need per-request
      // nonces threaded through every inline script Next emits. What these
      // do buy is the usual escalation paths from an injection:
      //   base-uri 'self'       — an injected <base> cannot re-point every
      //                           relative script and link on the page
      //   object-src 'none'     — no <object>/<embed> plugin content
      //   form-action 'self'    — an injected form cannot post credentials
      //                           or data to another origin (none of ours
      //                           does: checkout and billing go by fetch,
      //                           Google sign-in is a plain link)
      //   frame-ancestors 'none'— the modern form of X-Frame-Options: DENY
      //   upgrade-insecure-requests — a stray http:// asset loads over https
      {
        key: 'Content-Security-Policy',
        value: [
          "base-uri 'self'",
          "object-src 'none'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
