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

// GET /api/products/{id} (ProductDetailResponse.kt)
export type RecallListStatus = "LISTED" | "DELISTED";

export type DetailIngredient = {
  // 사전에 없는 성분은 null이고 name은 원문 이름
  ingredientId: number | null;
  name: string;
  rawName: string;
  // 1일 기준값. 기준값이 없거나 사전에 없는 성분은 null
  referenceAmount: number | null;
  referenceUnit: string | null;
  // 1일 함량(단위 통일). 계산하지 못하면 null이고 화면은 원문 amount/basis를 보여준다
  dailyAmount: number | null;
  dailyUnit: string | null;
  // 기준값 대비 %(소수점 버림). 기준값이 없거나 단위를 비교할 수 없으면 null
  referencePercent: number | null;
  // 판정하지 않으면 null(기준값 없음, 비교 못 하는 단위, 상한 2배 초과)
  meetsReference: boolean | null;
  exceedsUpperLimit: boolean;
  amount: number;
  unit: string;
  basisAmount: number;
  basisUnit: string;
};

export type DetailRecall = {
  productName: string;
  manufacturer: string | null;
  reason: string | null;
  expiryText: string | null;
  // DELISTED: 식약처 목록에서 빠졌지만 회수 사실은 남긴다
  listStatus: RecallListStatus;
};

export type ProductDetailResponse = {
  id: number;
  reportNo: string;
  name: string;
  manufacturer: string | null;
  form: string | null;
  reportedOn: string | null;
  intakeMethod: string | null;
  functionalMaterials: string | null;
  functionality: string | null;
  precautions: string | null;
  basisCheck: BasisCheck | null;
  parseStatus: ParseStatus;
  // 성분표 순서. 같은 성분 행이 여러 개여도 합치지 않는다
  ingredients: DetailIngredient[];
  // 신고번호가 정확히 같은 회수만
  recalls: DetailRecall[];
};

// GET /api/ingredients (ingredient/IngredientController.kt). 성분 사전 전체가 이름순으로 온다
export type IngredientItem = {
  id: number;
  name: string;
  englishName: string | null;
  // 함량 범위(min·max)의 단위. null이면 단위가 섞이지 않은 성분이다
  defaultUnit: string | null;
  // null이면 기준값이 없어 "기준 충족"(meetsReference)을 켤 수 없다
  referenceAmount: number | null;
  referenceUnit: string | null;
};

// product/ProductCompareResponse.kt CompareAmount: 성분 함량 한 행
export type CompareAmount = {
  // 1일 함량(단위 통일). 계산할 수 없으면 null이고 화면은 원문 값(amount/basis)을 보여준다
  dailyAmount: number | null;
  dailyUnit: string | null;
  // 기준값 대비 %(소수점 버림). 기준값이 없거나 단위를 비교할 수 없으면 null
  referencePercent: number | null;
  // 행마다 따로 판정한다. 판정하지 않으면 null(기준값 없음, 비교 못 하는 단위, 상한 2배 초과)
  meetsReference: boolean | null;
  exceedsUpperLimit: boolean;
  rawName: string;
  amount: number;
  unit: string;
  basisAmount: number;
  basisUnit: string;
};

// GET /api/products/explore (product/ProductExploreResponse.kt)
export type ExploreIngredient = Pick<IngredientItem, "id" | "name" | "defaultUnit" | "referenceAmount" | "referenceUnit">;

export type ProductExploreItem = {
  id: number;
  name: string;
  manufacturer: string | null;
  form: string | null;
  reportedOn: string | null;
  basisCheck: BasisCheck | null;
  parseStatus: ParseStatus;
  // 고른 성분 순서. 같은 성분 행이 여러 개면 values가 여러 개다(합치지 않음)
  amounts: { ingredientId: number; values: CompareAmount[] }[];
};

export type ProductExploreResponse = {
  totalCount: number;
  // 고른 성분(요청 순서)
  ingredients: ExploreIngredient[];
  // 함량순 정렬과 함량 범위가 걸린 성분
  baseIngredientId: number;
  items: ProductExploreItem[];
};

// GET /api/products/compare?ids= (product/ProductCompareResponse.kt)
export type CompareProduct = {
  id: number;
  name: string;
  // 위탁생산 제조사. 브랜드가 아니다(한 브랜드 제품의 제조사가 10곳 넘기도 함)
  manufacturer: string | null;
  form: string | null;
  basisCheck: BasisCheck | null;
  parseStatus: ParseStatus;
};

export type CompareIngredient = {
  // 사전에 없는 성분은 null이고 name은 원문 이름
  ingredientId: number | null;
  name: string;
  referenceAmount: number | null;
  referenceUnit: string | null;
  // 주 단위. 값의 dailyUnit이 다르면 "다른 단위 표기"
  defaultUnit: string | null;
  // products와 같은 순서. 제품에 없는 성분은 빈 목록, 같은 성분 행이 여러 개면 합치지 않는다
  values: CompareAmount[][];
};

export type ProductCompareResponse = {
  // 요청한 ids 순서
  products: CompareProduct[];
  // 여러 제품에 든 성분이 먼저 온다
  ingredients: CompareIngredient[];
};
