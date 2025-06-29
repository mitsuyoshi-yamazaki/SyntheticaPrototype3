/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath:
    process.env.NODE_ENV === 'production' ? '/SyntheticaPrototype2' : '',
  assetPrefix:
    process.env.NODE_ENV === 'production' ? '/SyntheticaPrototype2/' : '',
}

module.exports = nextConfig
