// 백엔드 응답 DTO를 그대로 옮긴 타입. 원본: ../alkkuni-backend/api/src/main/kotlin/com/alkkuni/api/
// BigDecimal은 JSON 숫자, LocalDate는 "2026-10-19" 문자열로 온다.

// common/ApiResponse.kt: 성공이면 data, 실패면 error 하나만 온다
export type ErrorDetail = { field: string; reason: string };
export type ErrorBody = { code: string; message: string; details?: ErrorDetail[] };
export type ApiResponse<T> = { data: T } | { error: ErrorBody };

// core: BasisCheck, ParseStatus
export type BasisCheck = "DAILY" | "PER_SERVING" | "MISMATCH" | "UNVERIFIED" | "UNREADABLE";
export type ParseStatus = "PARSED" | "NO_AMOUNT" | "NEEDS_REVIEW" | "REVIEWED";

// product/ProductSearchResponse.kt
export type ProductSearchSort = "relevance" | "latest" | "amount";

export type MatchedIngredient = { id: number; name: string };

export type ProductSearchItem = {
  id: number;
  name: string;
  manufacturer: string | null;
  form: string | null;
  reportedOn: string | null;
  // matchedIngredient의 1일 함량. 성분 검색이 아니거나 계산할 수 없으면 null
  dailyAmount: number | null;
  dailyUnit: string | null;
  basisCheck: BasisCheck | null;
  parseStatus: ParseStatus;
  // dailyAmount가 상한 2배를 넘으면 true(오류 의심). 성분 검색이 아니면 false
  exceedsUpperLimit: boolean;
};

export type ProductSearchResponse = {
  totalCount: number;
  // 검색어가 성분 사전과 일치했을 때만 있다. 함량순 정렬과 dailyAmount가 이 성분 기준이다
  matchedIngredient: MatchedIngredient | null;
  items: ProductSearchItem[];
};
