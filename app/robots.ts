import type { MetadataRoute } from "next";

// 검색 엔진 수집을 막는다(2026-11-18). 공개는 했지만 로그인까지 완성되기 전엔 검색으로 들어오지 않게 한다.
// 여는 방법은 docs/PROGRESS.md "검색 엔진 공개". 배포 헬스 체크(deploy/compose.web.yaml)도 이 경로를 쓴다
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
