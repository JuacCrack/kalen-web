/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "acdn-us.mitiendanube.com",
        pathname: "/stores/**",
      },
    ],
  },
};

module.exports = nextConfig;
