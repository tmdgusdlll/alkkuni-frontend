import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { api } from "@/lib/api";
import type { BrandItem, CategoryItem, IngredientItem, ProductExploreResponse, StatsResponse } from "@/types/api";

// 성분 사전(215개)은 Flyway로만 바뀌어 서버 메모리에 캐시한다. 조건이 바뀔 때마다 앞에 왕복이 붙지 않게
export async function getIngredients() {
  "use cache";
  cacheLife("hours");
  const res = await api<IngredientItem[]>("/api/ingredients");
  // 입력 없이 부르는 API라 4xx가 오면 사용자가 고칠 수 없다. error.tsx로 보낸다(던지면 캐시에 남지 않음)
  if ("error" in res) throw new Error(`성분 목록을 불러오지 못했습니다: ${res.error.code}`);
  return res.data;
}

// 브랜드 사전(200개 안팎)도 Flyway로만 바뀌어 성분 사전과 같이 캐시한다.
// 던지면 캐시에 남지 않는다. /explore는 실패를 받아 브랜드 필터만 숨긴다(orNull, 카테고리도 같음)
export async function getBrands() {
  "use cache";
  cacheLife("hours");
  const res = await api<BrandItem[]>("/api/brands");
  if ("error" in res) throw new Error(`브랜드 목록을 불러오지 못했습니다: ${res.error.code}`);
  return res.data;
}

// 기능성 카테고리 24개. 판정 규칙이 배포로만 바뀌고 제품 수는 하루 한 번 바뀐다
export async function getCategories() {
  "use cache";
  cacheLife("hours");
  const res = await api<CategoryItem[]>("/api/categories");
  if ("error" in res) throw new Error(`카테고리 목록을 불러오지 못했습니다: ${res.error.code}`);
  return res.data;
}

// 성분별 목록. /explore는 담기·빼기 때 페이지 전체를 서버에서 다시 그려 목록 조건이 같아도 다시 부르게 되므로,
// 같은 조건은 몇 분간 서버 캐시를 쓴다(데이터는 하루 한 번 바뀜). 메인 카드도 같은 쿼리로 불러 캐시를 나눠 쓴다.
// 4xx 응답도 캐시되지만 같은 입력이면 같은 답이다. 5xx·타임아웃은 던져서 캐시에 남지 않는다
export async function getExplore(query: string) {
  "use cache";
  cacheLife("minutes");
  return api<ProductExploreResponse>(`/api/products/explore?${query}`);
}

// 메인 "공식 데이터"·푸터 기준일. 하루 한 번(새벽 수집) 바뀐다. api의 Cache-Control은 서버 호출에 효과가 없어,
// 감싸지 않으면 모든 화면 요청(푸터)마다 백엔드 COUNT가 돈다
async function getStats() {
  "use cache";
  cacheLife("hours");
  const res = await api<StatsResponse>("/api/stats");
  if ("error" in res) throw new Error(`통계를 불러오지 못했습니다: ${res.error.code}`);
  return res.data;
}

// 실패하면 null. 숫자 칸·기준일만 숨기고 화면은 그대로 둔다(던진 결과는 캐시에 남지 않아 다음 요청이 다시 부른다)
export async function getStatsOrNull(where: string) {
  // 요청 때 부른다. 빌드 때(prerender) 백엔드를 부르면 백엔드 없는 CI에서 빌드가 깨진다
  await connection();
  try {
    return await getStats();
  } catch (e) {
    console.error(`${where}: 통계를 불러오지 못했습니다`, e);
    return null;
  }
}
