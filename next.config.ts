import type { NextConfig } from "next";

// 백엔드 주소. 로컬은 Spring Boot 기본 포트, 다른 곳을 볼 때만 API_URL로 바꾼다
const apiUrl = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // 브라우저는 같은 출처(/api)로만 부르고 Next가 백엔드로 넘긴다. 운영은 Nginx가 /api를 먼저 가져가므로 이 설정을 거치지 않는다
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
