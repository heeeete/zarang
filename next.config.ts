import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yivgwhosamvgluzmbxaw.supabase.co',
        port: '',
        // storage/v1/object 뿐만 아니라 storage/v1/render 경로도 허용하도록 수정
        pathname: '/storage/v1/**',
      },
    ],
  },
};

export default nextConfig;
