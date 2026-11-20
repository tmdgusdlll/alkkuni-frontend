import type { MetadataRoute } from "next";

// 검색 색인은 layout.tsx의 metadata robots(noindex)로 막는다(2026-11-18). 여기서 Disallow하면 크롤러가 페이지를 못 읽어
// noindex를 보지 못하고, 외부 링크로 알려진 URL은 "URL만 있는 결과"로 색인된다.
// 여는 방법은 docs/PROGRESS.md "검색 엔진 공개". 배포 헬스 체크(deploy/compose.web.yaml)도 이 경로를 쓴다
// 아래 Disallow는 색인이 아니라 크롤링 양을 막는 용도다(2026-11-21 GPTBot이 /explore 조합 URL로 하루 약 13만 건 호출,
// CloudFront 무료 플랜 요청 허용량 소진).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 실제로 몰려온 GPTBot(OpenAI 학습용)만 막는다. 다른 학습용 크롤러는 로그에 나타나면 여기에 더한다
      { userAgent: "GPTBot", disallow: "/" },
      // /explore 쿼리(담은 제품·성분·필터)는 조합마다 URL이 생겨 끝이 없다. 맨 /explore는 sitemap에 넣을 화면이라 열어 둔다.
      // allow: "/"는 쓰지 않는다. 기본이 허용이고, 첫 일치 규칙을 쓰는 크롤러는 Allow: /에 먼저 걸린다
      { userAgent: "*", disallow: "/explore?" },
    ],
  };
}
