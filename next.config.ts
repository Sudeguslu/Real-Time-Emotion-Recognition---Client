import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
};

// HMR'ın doğru host'a bağlanması için
if (process.env.NODE_ENV === "development") {
  (nextConfig as any).experimental = {
    ...(nextConfig as any).experimental,
  };
}

export default nextConfig;