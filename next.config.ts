import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Required for bcryptjs in Edge runtime (if needed)
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
