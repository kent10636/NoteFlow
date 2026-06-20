import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@uiw/react-md-editor"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
