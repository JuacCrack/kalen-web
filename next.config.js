/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "acdn-us.mitiendanube.com", pathname: "/stores/**" },
      { protocol: "https", hostname: "kalenindumentaria.com", pathname: "/**" },
      { protocol: "https", hostname: "www.kalenindumentaria.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.tu-dominio.com", pathname: "/**" },
    ],
  },
};

module.exports = nextConfig;