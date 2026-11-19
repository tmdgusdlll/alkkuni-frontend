import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

// 백엔드 주소. 로컬은 Spring Boot 기본 포트, 다른 곳을 볼 때만 API_URL로 바꾼다
const apiUrl = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // 운영 이미지(Dockerfile)는 node_modules 없이 .next/standalone의 server.js만 띄운다
  output: "standalone",
  // 브라우저는 같은 출처(/api)로만 부르고 Next가 백엔드로 넘긴다. 운영은 Nginx가 /api를 먼저 가져가므로 이 설정을 거치지 않는다
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // 요청 때 만드는 메타데이터(제품 상세 generateMetadata)는 기본으로 <head> 뒤에 스트리밍된다. <head>만 읽는 크롤러에는
  // 공유 카드 태그가 없어 보이므로 Next 기본 목록에 카카오톡 미리보기·다음 검색을 더한다(이 설정은 기본 목록을 대체함).
  // 기본 정규식을 내부 경로에서 가져와 Next 업그레이드 때 목록이 같이 갱신된다. 경로가 바뀌면 빌드가 실패해 바로 드러난다
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|kakaotalk-scrap|Daumoa`, HTML_LIMITED_BOT_UA_RE.flags),
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
