import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@uiw/react-md-editor"],
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "tesseract.js",
    "pdf-parse",
  ],
};

export default nextConfig;
