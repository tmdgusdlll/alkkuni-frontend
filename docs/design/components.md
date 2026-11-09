# 알꾼이 프론트 컴포넌트 명세

디자인 시안(캔버스 "알꾼이 웹 서비스 디자인")을 Next.js로 옮길 때의 기준 문서예요.
토큰은 `app/globals.css`(Tailwind v4 `@theme`)에 있고, 이 문서의 클래스 이름은 그 토큰을 기준으로 해요. 규칙은 루트 `DESIGN.md`를 따르고, 이 문서와 다르면 `DESIGN.md`가 맞아요. 로그인·구매·소식·AI 관련 컴포넌트는 MVP 범위 밖이에요(`DESIGN.md` "MVP 범위").

## 0. 공통 규칙

- 레이아웃: 본문 최대 폭 `max-w-[1200px] mx-auto px-6`. 2단 레이아웃은 `flex flex-wrap`으로 구성하고 주 영역 `flex-[999_1_560px] min-w-0`, 보조 영역 `flex-[1_1_320px]`을 줘요. 그러면 좁은 화면에서 자동으로 1단이 돼요.
- 숫자는 크고 굵게, 단위는 작게: `<b class="tabular-nums text-2xl font-extrabold">25<small class="text-xs text-ink-muted">μg</small></b>`
- 상태는 색만으로 구분하지 않아요. 배지에는 항상 아이콘과 글자가 함께 들어가요.
- 효능을 단정하는 문구("~에 좋아요", "추천")는 쓰지 않아요. 기능성은 식약처 인정 문구를 그대로 보여줘요.
- 터치 영역은 최소 44px이에요. 아이콘만 있는 버튼에는 `aria-label`을 달아요.
- 아이콘: 둥근 선 아이콘(stroke 2, round cap/join). `lucide-react`가 시안과 결이 가장 비슷해요.

## 1. 글꼴 설정 (Pretendard)

```bash
npm i pretendard
```

```tsx
// app/layout.tsx
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
```

> `src` 경로는 `layout.tsx` 기준 상대 경로예요. 설치한 패키지 버전에서 파일 위치가 다르면 `node_modules/pretendard/dist/web/` 아래에서 확인해 주세요.

## 2. API 타입

타입은 백엔드 응답 DTO(`../alkkuni-backend/api/src/main/kotlin/com/alkkuni/api/**/*Response.kt`)를 그대로 옮겨 `types/`에 둬요. 화면에 맞춰 모양을 새로 짓지 않아요. 아래 props의 타입 이름(`CompareAmount`, `BasisCheck` 등)은 그 DTO 이름이에요.

## 3. 컴포넌트 목록

### 레이아웃

| 컴포넌트 | props | 메모 |
|---|---|---|
| `SiteHeader` | `active: "home" \| "compare" \| "ai" \| "drawer"`, `user?: { nickname: string }` | 로고 · 메뉴 · 검색 아이콘 · 로그인(또는 프로필). 활성 메뉴는 `bg-brand-50 text-brand-700 font-bold`, `aria-current="page"` |
| `SiteFooter` | `baseDate: string` | "데이터 출처: 식품의약품안전처 식품안전나라 · 기준일 YYYY.MM.DD", 이용약관, 개인정보처리방침. 모든 페이지에 노출 |
| `Breadcrumb` | `items: { label: string; href?: string }[]` | 비교·상세 페이지 상단 |
| `AiFab` | — | 오른쪽 아래 고정 버튼 `bg-brand-700 shadow-fab rounded-full`. 메인에서만 노출 |

### 검색·탐색

| 컴포넌트 | props | 메모 |
|---|---|---|
| `SearchBar` | `size: "hero" \| "compact"`, `defaultValue?: string` | hero: 높이 68px, `border-2 border-brand-500 shadow-search rounded-full`. `<label>`은 화면에서 숨김(`sr-only`) |
| `IngredientChip` | `label: string`, `selected?: boolean`, `href?: string`, `onClick?: () => void` | 선택됨 `bg-brand-700 text-white`, 기본 `bg-white border-brand-200`. 토글이면 `aria-pressed` |
| `ShortcutCard` | `icon`, `title`, `description`, `href`, `tone: "brand" \| "lime" \| "recall" \| "warn"` | 메인 바로가기 4개 |

### 상태·배지

| 컴포넌트 | props | 메모 |
|---|---|---|
| `StatusBadge` | `status: "NORMAL" \| "RECALLED" \| "CHANGED"` (서랍 API가 생기면 그 타입으로) | NORMAL: `bg-ok-bg text-ok-fg` + 체크 / RECALLED: `bg-recall-bg text-recall-fg` + 경고 삼각형 / CHANGED: `bg-warn-bg text-warn-fg` + 연필 |
| `BasisBadge` | `basisCheck: BasisCheck \| null` | `DAILY`·`PER_SERVING`: "1일 기준"(민트) / 그 외·null: "표시 기준량"(중립 회색) + 물음표. 누르면 설명 노출 |
| `AmountStatus` | `amount: CompareAmount`, `defaultUnit: string \| null`, `parseStatus: ParseStatus` | `DESIGN.md` 7.3.1: "다른 단위 표기"(중립), "검수 대기"(노랑) |
| `RecallBanner` | `recentCount: number` | 0보다 크면 코랄 "최근 회수 N건 · 내 서랍 확인하기"(→ /my/drawer), 0이면 민트 "최근 회수된 영양제가 없어요" |
| `NewsTag` | `type: "RECALL" \| "NOTICE" \| "ARTICLE"` | 회수(코랄) / 공지(하늘) / 기사(중립) |

### 수치 시각화

| 컴포넌트 | props | 메모 |
|---|---|---|
| `AmountValue` | `values: CompareAmount[]`, `size?: "sm" \| "md" \| "lg"` | 큰 숫자 + 작은 단위. 행이 여러 개면 "5.95mg + 2.55mg". `dailyAmount`가 null이면 원문 `amount unit / basisAmount basisUnit` |
| `AmountBar` | `value: number`, `max: number`, `tone?: "brand" \| "a" \| "b" \| "c"` | 가로 막대. 너비 = value / max, 최소 4%. 바탕 `bg-track`, 막대 `bg-brand-500`. 장식이므로 `aria-hidden` |
| `DvProgress` | `percent: number \| null`, `hasReference: boolean` | `referencePercent`를 둥근 진행 바로. 100% 초과는 가득 채우고 `bg-brand-700`. null이면 막대 없이, 기준값이 없을 때만 "기준치 없음". `role="img"`에 `aria-label` 필수 |

### 제품

| 컴포넌트 | props | 메모 |
|---|---|---|
| `ProductCard` | `item: ProductSearchItem`, `onToggleCompare`, `inCompare` | 검색 결과용. 서랍 담기는 로그인 이후 |
| `ExploreTable` | `data: ProductExploreResponse` | 성분별 제품 목록. 정렬은 API 순서 그대로, 제품명 열 `sticky left-0`, 표는 `overflow-x-auto` 상자 안 |
| `ExploreFilters` | 필터 값(URL `searchParams`) | 성분 칩·제외 성분·제형·함량 범위·기준 충족. 초안에 없어 새로 그려요 |
| `CompareTable` | `data: ProductCompareResponse` (제품 2~3개) | 성분별로 나란히, 제품별 색 A·B·C. 빈 목록은 "—" |
| `IngredientTable` | `ingredients: DetailIngredient[]` | 상세 성분표: 성분명 · 함량 · `DvProgress` · % · `AmountStatus` |
| `FunctionalClaims` | `text: string \| null` | "식약처 인정 기능성" — `functionality` 원문 그대로 표시 |
| `CautionBox` | `text: string \| null` | `precautions` 원문, `bg-warn-surface` |
| `RecallCard` | `recall: DetailRecall` | 사유 · 대상 소비기한(`expiryText`) + "위 소비기한이 적힌 제품만 해당돼요". 회수일·공지 링크는 API에 없음 |
| `PurchasePanel` | `purchaseUrl`, `saved`, `onToggleSave`, `onAddCompare` | 구매 버튼 아래에 `AffiliateNotice`를 반드시 함께 렌더링 |
| `AffiliateNotice` | — | 고정 문구: "이 링크로 구매하면 알꾼이가 일정 수수료를 받을 수 있어요. 수수료는 비교 순서에 영향을 주지 않아요." |

### 내 서랍·마이페이지

| 컴포넌트 | props | 메모 |
|---|---|---|
| `MyPageNav` | `active: "drawer" \| "notifications" \| "account"` | 데스크톱은 왼쪽 세로 메뉴, 좁은 화면에서는 위로 쌓임 |
| `ProfileCard` | `nickname`, `provider: "KAKAO" \| "NAVER" \| "GOOGLE"` | |
| `DrawerSummary` | `total: number`, `recalled: number`, `changed: number` | recalled > 0: 코랄 "확인이 필요한 영양제가 있어요" + 숫자 3칸 / 0: 민트 "담은 영양제 N개 · 회수 0건 · 안심" |
| `DrawerItemCard` | `item: DrawerItem`, `onRemove` | RECALLED는 "사유 보기"로 펼침(`aria-expanded`) |
| `ComingSoonCard` | `title`, `description` | "내 서랍 성분 합산 보기" 자리. `disabled` + "준비 중" 배지 |

### 공통

| 컴포넌트 | props | 메모 |
|---|---|---|
| `EmptyState` | `illustration`, `title`, `description`, `action?: { label; href }` | 후기 없음, 빈 서랍 등. 가짜 후기는 넣지 않음 |
| `TrustStat` | `value: string`, `label: string` | 메인 "공식 데이터로 만들어요" 숫자 카드 |

## 4. 라우트

| 경로 | 화면 | 시안 |
|---|---|---|
| `/` | 메인 | `Main.dc.html` |
| `/search?q=&sort=` | 검색 결과 | (미작성) |
| `/explore?ingredient=&...` | 성분별 제품 목록 | `Compare.dc.html` 위쪽 표 |
| `/compare?ids=` | 제품 비교 | `Compare.dc.html` 아래 "여러 성분 나란히 보기" |
| `/products/[id]` | 제품 상세 | `Detail.dc.html` |
| `/my/drawer` | 내 서랍 | `Drawer.dc.html` |
| `/my/notifications` | 알림 설정 | (미작성) |
| `/login` | 로그인 · 이메일 입력 | (미작성) |
| `/ai` | AI 도우미 | (미작성) |

## 5. 작업 순서 제안

1. `globals.css` 토큰 + Pretendard 설정
2. 배지·수치 컴포넌트(`StatusBadge`, `BasisBadge`, `AmountValue`, `AmountBar`, `DvProgress`) — 가장 많이 재사용돼요
3. `SiteHeader` / `SiteFooter` / `EmptyState`
4. 페이지: 검색 → 제품 상세 → 성분별 목록 → 제품 비교 → 메인. 내 서랍은 로그인 이후
