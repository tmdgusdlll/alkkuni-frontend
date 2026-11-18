import type { MetadataRoute } from "next";

// 검색 색인은 layout.tsx의 metadata robots(noindex)로 막는다(2026-11-18). 여기서 Disallow하면 크롤러가 페이지를 못 읽어
// noindex를 보지 못하고, 외부 링크로 알려진 URL은 "URL만 있는 결과"로 색인된다.
// 여는 방법은 docs/PROGRESS.md "검색 엔진 공개". 배포 헬스 체크(deploy/compose.web.yaml)도 이 경로를 쓴다
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
