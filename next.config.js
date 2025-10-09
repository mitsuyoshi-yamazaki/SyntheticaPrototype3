/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === "production" ? "/SyntheticaPrototype3" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/SyntheticaPrototype3/" : "",
}

module.exports = nextConfig
