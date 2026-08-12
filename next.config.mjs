// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The image this service ran before was a standalone build (its entrypoint was
  // `node server.js`). Rebuilding it as a plain `next start` app changed how the
  // server initialises and every request started answering 500 on a WorkOS
  // client that never gets credentials here. Restoring standalone restores the
  // runtime the service was configured for.
  output: "standalone",
  // Next.js 16: Enable Cache Components (PPR + "use cache" directive)
  cacheComponents: true,

  async redirects() {
    return [
      {
        source: "/home/threads/:path*",
        destination: "/threads/:path*",
        permanent: true,
      },
      {
        source: "/home/use-cases",
        destination: "/use-cases",
        permanent: true,
      },
      {
        source: "/home/pricing",
        destination: "/pricing",
        permanent: true,
      },
      {
        source:
          "/:slug(prospects|candidates|partners|investors|participants|creators|potential-members|guests)",
        destination: "/",
        permanent: false,
      },
    ];
  },

  compiler: {
    removeConsole: true,
  },
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        // Twitter/X profile images and tweet media
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        // UploadThing storage (user uploads, video posters)
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        // LinkedIn profile images, post media, and messaging attachments
        protocol: "https",
        hostname: "*.licdn.com",
      },
      {
        // Mux-generated video posters
        protocol: "https",
        hostname: "image.mux.com",
      },
      {
        // Convex storage (workspace attachment previews)
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Turbopack: Persist compiler artifacts for faster dev restarts
    turbopackFileSystemCacheForDev: true,
  },

  // Misc project settings (keep or remove as you like)
  compress: true,
  trailingSlash: false,
};

export default nextConfig;
