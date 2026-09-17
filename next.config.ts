import type { NextConfig } from "next";

const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath =
  rawBase && rawBase !== "/"
    ? rawBase.startsWith("/")
      ? rawBase.replace(/\/$/, "")
      : `/${rawBase.replace(/\/$/, "")}`
    : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
