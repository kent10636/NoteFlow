import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@uiw/react-md-editor"],
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "tesseract.js",
    "pdf-parse",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "reactflow"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
