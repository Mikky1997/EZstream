/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'vidsrc.me',
      },
      {
        protocol: 'https',
        hostname: 'vidsrc-embed.ru',
      },
    ],
  },
};

export default nextConfig;
