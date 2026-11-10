import Link from "next/link";
import { Suspense } from "react";
import { BasisBadge, ReviewBadge } from "@/components/badges";
import { FormIcon } from "@/components/FormIcon";
import { SearchBar } from "@/components/SearchBar";
import { api } from "@/lib/api";
import type { ProductSearchItem, ProductSearchResponse, ProductSearchSort } from "@/types/api";

const PAGE_SIZE = 20;
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
  const res = await api<ProductSearchResponse>(`/api/products?${query}`);

  return (
    <>
      <SearchBar defaultValue={params.q} />
      {"error" in res ? (
        // 백엔드 문구를 그대로 보여준다(ErrorCode.message는 사용자에게 보여도 되는 문장만 쓴다)
        <p role="alert" className="mt-10 text-center text-ink-muted">
          {res.error.details?.[0]?.reason ?? res.error.message}
        </p>
      ) : (
        <Results params={params} data={res.data} />
      )}
    </>
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
            <p className="mt-1 text-sm text-ink-muted">
              {/* 성분 이름마다 받침이 달라 조사를 붙이지 않는다 */}
              성분 <b className="text-ink">{ingredient.name}</b> · 함량은 이 성분의 1일 함량이에요.
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

      {data.items.length === 0 ? (
        <p className="mt-16 text-center text-ink-muted">검색 결과가 없어요. 다른 이름으로 검색해 보세요.</p>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-card border border-line bg-white shadow-card">
          {data.items.map((item) => (
            <ResultRow key={item.id} item={item} showAmount={ingredient !== null} />
          ))}
        </ul>
      )}

      {lastPage > 0 && (
        <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-4 text-sm">
          {params.page > 0 ? (
            <Link href={searchHref({ ...params, page: params.page - 1 })} className="font-bold">
              ← 이전
            </Link>
          ) : (
            <span className="text-ink-muted">← 이전</span>
          )}
          <span className="tabular-nums text-ink-muted">
            {params.page + 1} / {lastPage + 1}
          </span>
          {params.page < lastPage ? (
            <Link href={searchHref({ ...params, page: params.page + 1 })} className="font-bold">
              다음 →
            </Link>
          ) : (
            <span className="text-ink-muted">다음 →</span>
          )}
        </nav>
      )}
    </section>
  );
}

function ResultRow({ item, showAmount }: { item: ProductSearchItem; showAmount: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 flex-[999_1_320px] items-center gap-4">
        <FormIcon form={item.form} />
        <div className="min-w-0">
        <p className="font-bold text-ink">{item.name}</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {[item.manufacturer, item.form, item.reportedOn && `${item.reportedOn.replaceAll("-", ".")} 신고`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        </div>
      </div>
      <div className="flex flex-[1_1_auto] items-center justify-end gap-2">
        {/* DESIGN.md 7.3.1: 검수 대기 제품이거나 상한 2배를 넘는 오류 의심 값 */}
        {(item.parseStatus === "NEEDS_REVIEW" || item.exceedsUpperLimit) && <ReviewBadge />}
        {showAmount &&
          (item.dailyAmount === null ? (
            // 1일 함량을 계산하지 못한 제품. 원문 값은 상세에서 보여준다
            <span className="text-sm text-ink-muted">함량 확인 필요</span>
          ) : (
            <>
              <b className="tabular-nums text-xl font-extrabold text-ink">
                {item.dailyAmount.toLocaleString("ko-KR")}
                <small className="ml-0.5 text-xs font-medium text-ink-muted">{item.dailyUnit}</small>
              </b>
              {/* 배지 폭이 달라도 숫자 열이 흔들리지 않게 자리를 고정한다 */}
              <span className="w-[92px]">
                <BasisBadge basisCheck={item.basisCheck} />
              </span>
            </>
          ))}
      </div>
    </li>
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
