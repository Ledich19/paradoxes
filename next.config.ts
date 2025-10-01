import type { NextConfig } from "next";


const repo = "paradoxes";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, 
  trailingSlash: true, 
  basePath: repo ? `/${repo}` : "",
  assetPrefix: repo ? `/${repo}/` : "",
};

export default nextConfig;
