import type { MetadataRoute } from "next";

// 검색 색인은 layout.tsx의 metadata robots(noindex)로 막는다(2026-11-18). 여기서 Disallow하면 크롤러가 페이지를 못 읽어
// noindex를 보지 못하고, 외부 링크로 알려진 URL은 "URL만 있는 결과"로 색인된다.
// 여는 방법은 docs/PROGRESS.md "검색 엔진 공개". 배포 헬스 체크(deploy/compose.web.yaml)도 이 경로를 쓴다
// 아래 Disallow는 색인이 아니라 크롤링 양을 막는 용도다(2026-11-21 GPTBot이 /explore 조합 URL로 하루 약 13만 건 호출,
// CloudFront 무료 플랜 요청 허용량 소진).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI 학습용 크롤러. 검색 유입과 상관없어 전체를 막는다
      { userAgent: "GPTBot", disallow: "/" },
      // /explore는 제품 id·성분 조합마다 URL이 생겨 끝이 없고, 검색 결과에 올릴 페이지도 아니다
      { userAgent: "*", allow: "/", disallow: "/explore" },
    ],
  };
}
