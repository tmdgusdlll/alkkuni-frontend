import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BasisBadge, ExportBadge, ReviewBadge } from "@/components/badges";
import { FormIcon } from "@/components/FormIcon";
import { Pagination } from "@/components/Pagination";
import { ProductPhoto } from "@/components/ProductPhoto";
import { SearchBar } from "@/components/SearchBar";
import { api } from "@/lib/api";
import { formatAmount, productMeta, splitBrandName } from "@/lib/format";
import type { ProductSearchItem, ProductSearchResponse, ProductSearchSort } from "@/types/api";

// 검색어를 제목에 넣으려면 generateMetadata가 searchParams를 기다려 페이지 틀까지 요청 때 만들어진다. 고정 제목으로 둔다
export const metadata: Metadata = {
  title: "제품 검색",
  description: "제품명·브랜드·성분으로 영양제를 찾고 함량을 확인해요",
};

// 격자 4·3·2열이 모두 나눠떨어지는 개수(2026-11-23 정함)
const PAGE_SIZE = 24;
// 백엔드 page 상한(ProductController MAX_PAGE)
const MAX_PAGE = 500;

const SORTS: { value: ProductSearchSort; label: string }[] = [
  { value: "relevance", label: "관련도순" },
  { value: "latest", label: "최신순" },
  { value: "amount", label: "함량순" },
];

type Params = { q: string; sort: ProductSearchSort; page: number };

// searchParams는 요청 때만 알 수 있어 Suspense 안에서 읽는다(cacheComponents). 바깥 틀은 미리 만들어진다
export default function SearchPage(props: PageProps<"/search">) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <Suspense fallback={<p className="text-ink-muted">불러오는 중…</p>}>
        <SearchContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchContent({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const params = parseParams(await searchParams);

  if (!params.q) {
    return (
      <>
        <SearchBar />
        <p className="mt-10 text-center text-ink-muted">검색어를 입력해 주세요.</p>
      </>
    );
  }

  const query = new URLSearchParams({ q: params.q, sort: params.sort, page: String(params.page), size: String(PAGE_SIZE) });

  return (
    <>
      <SearchBar defaultValue={params.q} />
      {/* key가 바뀌면 새 경계라 정렬·페이지 이동 때도 이전 결과 대신 "불러오는 중"을 보여준다 */}
      <Suspense key={String(query)} fallback={<p className="mt-10 text-center text-ink-muted">불러오는 중…</p>}>
        <SearchResults params={params} query={query} />
      </Suspense>
    </>
  );
}

async function SearchResults({ params, query }: { params: Params; query: URLSearchParams }) {
  const res = await api<ProductSearchResponse>(`/api/products?${query}`);
  if (!("error" in res)) return <Results params={params} data={res.data} />;

  const detail = res.error.details?.[0];
  return (
    // 백엔드 문구를 그대로 보여준다(ErrorCode.message는 사용자에게 보여도 되는 문장만 쓴다)
    <div role="alert" className="mt-10 text-center text-ink-muted">
      <p>{detail?.reason ?? res.error.message}</p>
      {/* 함량순을 못 쓰는 검색어 등 정렬이 원인이면 기본 정렬로 돌아갈 길을 준다 */}
      {detail?.field === "sort" && params.sort !== "relevance" && (
        <Link href={searchHref({ ...params, sort: "relevance", page: 0 })} className="mt-3 inline-block font-bold text-brand-700">
          관련도순으로 보기
        </Link>
      )}
    </div>
  );
}

function Results({ params, data }: { params: Params; data: ProductSearchResponse }) {
  const ingredient = data.matchedIngredient;
  // 함량순은 성분 검색일 때만 백엔드가 받는다
  const sorts = ingredient ? SORTS : SORTS.filter((s) => s.value !== "amount");
  const lastPage = Math.min(Math.ceil(data.totalCount / PAGE_SIZE) - 1, MAX_PAGE);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            ‘{params.q}’ 검색 결과 <span className="tabular-nums text-brand-700">{data.totalCount.toLocaleString("ko-KR")}</span>개
          </h1>
          {ingredient && (
            // details는 p 안에 둘 수 없어 div로 감싼다
            <div className="mt-1 text-sm text-ink-muted">
              {/* 성분 이름마다 받침이 달라 조사를 붙이지 않는다 */}
              성분 <b className="text-ink">{ingredient.name}</b> · 함량은 이 성분의 1일 함량이에요. <BasisHelp />
            </div>
          )}
          {/* 검색어가 브랜드 표기면 이름에 검색어가 없는 그 브랜드 제품("애터미" → "ATOMY …")도 더해져 이유를 알린다 */}
          {data.matchedBrand && (
            <p className="mt-1 text-sm text-ink-muted">
              브랜드 <b className="text-ink">{data.matchedBrand.name}</b> 제품도 함께 보여줘요.
            </p>
          )}
        </div>
        <nav aria-label="정렬" className="flex gap-1">
          {sorts.map((s) => (
            <Link
              key={s.value}
              href={searchHref({ ...params, sort: s.value, page: 0 })}
              aria-current={s.value === params.sort ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm ${
                s.value === params.sort ? "bg-brand-50 font-bold text-brand-700" : "text-ink-soft hover:bg-surface"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {data.totalCount === 0 ? (
        <p className="mt-16 text-center text-ink-muted">검색 결과가 없어요. 다른 이름으로 검색해 보세요.</p>
      ) : params.page > lastPage ? (
        // 공유 링크나 데이터가 줄어 마지막 페이지를 넘은 경우
        <p className="mt-16 text-center text-ink-muted">
          이 페이지에는 결과가 없어요.{" "}
          <Link href={searchHref({ ...params, page: 0 })} className="font-bold text-brand-700">
            첫 페이지로
          </Link>
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {data.items.map((item) => (
            <ResultCard key={item.id} item={item} showAmount={ingredient !== null} />
          ))}
        </ul>
      )}

      <Pagination page={params.page} lastPage={lastPage} href={(page) => searchHref({ ...params, page })} />
    </section>
  );
}

// 검색 결과 격자 카드(2026-11-23 시안 A). 위 브랜드, 아래 브랜드를 뗀 이름(백엔드 PLANNING.md "검색 결과 표시" 1)
function ResultCard({ item, showAmount }: { item: ProductSearchItem; showAmount: boolean }) {
  const { brand, name } = splitBrandName(item.brand?.name ?? null, item.name);
  const icon = <FormIcon form={item.form} size={88} />;
  return (
    <li className="min-w-0">
      {/* 카드 전체가 링크라 안에 누르는 요소(배지 설명 등)를 두지 않는다. 설명은 결과 위에 한 번(BasisHelp) */}
      <Link
        href={`/products/${item.id}`}
        className="flex h-full flex-col rounded-card border border-line bg-white p-2.5 shadow-card transition-colors hover:border-brand-200 sm:p-3.5"
      >
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-tile bg-brand-50">
          {item.imageUrl ? <ProductPhoto src={item.imageUrl} fallback={icon} /> : icon}
        </div>
        <div className="mt-3 flex min-w-0 flex-1 flex-col">
          {/* 브랜드 없는 카드도 이름 줄이 맞게 자리를 둔다 */}
          <p className="min-h-4 truncate text-xs font-bold text-ink-soft">{brand}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[2.75em] font-bold leading-snug text-ink">{name}</p>
          {/* 신고일은 상세에서 본다. 카드 폭에 넣으면 제조사가 잘린다 */}
          <p className="mt-1 truncate text-xs text-ink-muted sm:text-sm">
            {productMeta({ manufacturer: item.manufacturer, form: item.form })}
          </p>
          {(item.exportOnly || item.parseStatus === "NEEDS_REVIEW" || item.exceedsUpperLimit) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.exportOnly && <ExportBadge />}
              {/* DESIGN.md 7.3.1: 검수 대기 제품이거나 상한 2배를 넘는 오류 의심 값 */}
              {(item.parseStatus === "NEEDS_REVIEW" || item.exceedsUpperLimit) && <ReviewBadge />}
            </div>
          )}
          {showAmount && <CardAmount item={item} />}
        </div>
      </Link>
    </li>
  );
}

// 함량과 기준을 붙여 둔다. 기준을 숨기면 1정 기준 값이 하루치처럼 읽혀서다(2026-11-23 정함).
// 확인한 1일 기준만 배지로 띄우고, 대부분인 표시 기준량은 작은 글자로 둔다
function CardAmount({ item }: { item: ProductSearchItem }) {
  if (item.dailyAmount === null) {
    // 1일 함량을 계산하지 못한 제품. 원문 값은 상세에서 보여준다
    return <p className="mt-auto pt-2 text-sm text-ink-muted">함량 확인 필요</p>;
  }
  const daily = item.basisCheck === "DAILY" || item.basisCheck === "PER_SERVING";
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2">
      <b className="tabular-nums text-lg font-extrabold text-ink sm:text-xl">
        {formatAmount(item.dailyAmount)}
        <small className="ml-0.5 text-xs font-medium text-ink-muted">{item.dailyUnit}</small>
      </b>
      {daily ? <BasisBadge basisCheck={item.basisCheck} /> : <span className="text-xs text-ink-muted">표시 기준량</span>}
    </div>
  );
}

// 카드 안 "표시 기준량" 설명. 카드가 링크라 결과 위에 한 번만 둔다. 글줄 중간에서 열려도 좁은 화면 밖으로 나가지 않게 폭을 제한한다
function BasisHelp() {
  return (
    <details className="relative inline-block">
      <summary className="cursor-pointer list-none font-bold text-brand-700 underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
        표시 기준량이란?
      </summary>
      <p className="absolute left-0 top-full z-10 mt-1 w-64 max-w-[calc(100vw-3rem)] rounded-tile border border-line bg-white p-3 text-xs text-ink-soft shadow-card">
        제품 성분표에 적힌 기준량(예: 1정)당 함량이에요. 하루 섭취량과 같은지 확인하지 못했어요. 확인한 제품에는 ‘1일 기준’을 붙여요.
      </p>
    </details>
  );
}

function parseParams(sp: Record<string, string | string[] | undefined>): Params {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const sort = one(sp.sort);
  const page = Number.parseInt(one(sp.page), 10);
  return {
    q: one(sp.q).trim(),
    // 모르는 값은 기본값으로. 함량순 가능 여부는 백엔드가 판단해 에러 문구를 준다
    sort: SORTS.some((s) => s.value === sort) ? (sort as ProductSearchSort) : "relevance",
    page: Number.isInteger(page) && page >= 0 ? Math.min(page, MAX_PAGE) : 0,
  };
}

function searchHref({ q, sort, page }: Params) {
  const sp = new URLSearchParams({ q });
  if (sort !== "relevance") sp.set("sort", sort);
  if (page > 0) sp.set("page", String(page));
  return `/search?${sp}`;
}
