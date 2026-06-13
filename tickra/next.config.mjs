/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Tree-shake icon and motion libraries — lucide-react alone exports
    // 1,000+ icons and we pull a handful per page; framer-motion ships
    // a few dozen helpers we likewise sample. Adds three's drei wrapper
    // for the same reason (only used on a couple of routes).
    optimizePackageImports: ['lucide-react', 'framer-motion', '@react-three/drei'],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Isolate the browsing context so window.opener and cross-origin
      // pop-ups can't script back into our pages.
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      // Block legacy Flash/Silverlight cross-domain policy probing.
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      {
        key: 'Permissions-Policy',
        value: [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'interest-cohort=()',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'gyroscope=()',
          'accelerometer=()',
          'autoplay=()',
        ].join(', '),
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
