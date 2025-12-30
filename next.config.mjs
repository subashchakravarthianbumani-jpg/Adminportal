/** @type {import('next').NextConfig} */

import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

const nextConfig = {
  reactStrictMode: false,
  basePath: process.env.BASEPATH,
  redirects: async () => [
    {
      source: '/',
      destination: '/en/dashboards/dashboard',
      permanent: true,
      locale: false
    },
    {
      source: '/:lang(en|fr|ar)',
      destination: '/:lang/dashboards/dashboard',
      permanent: true,
      locale: false
    },

    // {
    //   source: '/((?!(?:en|fr|ar|front-pages|favicon.png|uploads|images)\\b)):path',
    //   destination: '/en/:path',
    //   permanent: true,
    //   locale: false,
    // },

    {
      source: '/:path((?!en|fr|ar|front-pages|favicon\\.png|images|uploads|web-logo|api).*)',
      destination: '/en/:path*',
      permanent: true,
      locale: false
    }
  ]
}

export default withBundleAnalyzer(nextConfig)
