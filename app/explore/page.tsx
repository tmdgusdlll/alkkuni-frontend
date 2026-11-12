import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { AmountCell, barValue } from "@/components/AmountCell";
import { BasisBadge, OtherUnitBadge, ReviewBadge } from "@/components/badges";
import { Pagination } from "@/components/Pagination";
import { ComparePanel } from "./ComparePanel";
import { api } from "@/lib/api";
import { getExplore, getIngredients } from "@/lib/queries";
import { productMeta } from "@/lib/format";
import type { ErrorBody, IngredientItem, ProductExploreResponse, ProductSearchResponse } from "@/types/api";

export const metadata: Metadata = { title: "성분별 제품 목록 - 알꾼이" };

// 아래 비교 칸이 보이게 짧게 둔다(DESIGN.md 8.2)
const PAGE_SIZE = 10;
// 백엔드 page 상한(ProductController MAX_PAGE)
const MAX_PAGE = 500;
// 고른 성분·제외 성분 각각의 상한(ProductExploreService MAX_IDS)
const MAX_IDS = 5;
// 비교 칸에 담을 수 있는 제품 수(ProductCompareService MAX_PRODUCTS)
const MAX_COMPARE = 3;
// 표 위 제품 검색 결과 수
const SEARCH_SIZE = 5;
// 제형 필터 후보. 제품 수가 많은 순이고 "기타"는 뺐다
const FORMS = ["정", "캡슐", "분말", "액상", "젤리", "환", "과립", "겔", "바", "시럽"];
// 처음 화면의 빠른 선택. id는 환경마다 다를 수 있어 이름으로 찾는다
const POPULAR = ["비타민 C", "비타민 D", "아연", "마그네슘", "칼슘", "철", "루테인", "엽산"];

type Params = {
  ingredients: number[];
  exclude: number[];
  forms: string[];
  // 숫자 문자열 그대로 넘긴다(소수 변환으로 값이 바뀌지 않게). 비었으면 ""
  min: string;
  max: string;
  meetsReference: boolean;
  // API 값 그대로: ""(첫 성분 함량순), "amount:{id}"(다른 고른 성분 함량순), "latest"
  sort: string;
  page: number;
  // 비교 칸에 담은 제품 id(담은 순서). URL은 ids=12,34
  ids: number[];
  // 표 위 제품 검색어(목록 밖 제품을 담을 때). 비었으면 ""
  q: string;
  // 4개째를 담으려 했으면 true. 앞 3개만 쓰고 안내 문구를 보여준다(다음 링크부터는 3개만 넘어가 사라짐)
  overflow: boolean;
};

// 성분을 고르지 않은 처음 화면의 조건
const EMPTY: Params = {
  ingredients: [],
  exclude: [],
  forms: [],
  min: "",
  max: "",
  meetsReference: false,
  sort: "",
  page: 0,
  ids: [],
  q: "",
  overflow: false,
};

// DESIGN.md 8.2. searchParams는 요청 때만 알 수 있어 Suspense 안에서 읽는다(cacheComponents)
export default function ExplorePage(props: PageProps<"/explore">) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <Suspense fallback={<Loading />}>
        <ExploreContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

// 표 위 제품 검색. 담기·빼기 때 다시 부르지 않게 위와 같이 캐시한다
async function searchProducts(q: string) {
  "use cache";
  cacheLife("minutes");
  return api<ProductSearchResponse>(`/api/products?${new URLSearchParams({ q, size: String(SEARCH_SIZE) })}`);
}

function exploreQuery(p: Params) {
  const q = toQuery(p);
  q.set("size", String(PAGE_SIZE));
  return String(q);
}

async function ExploreContent({ searchParams }: { searchParams: PageProps<"/explore">["searchParams"] }) {
  // searchParams를 먼저 기다린다. 사전 조회가 빌드 때(prerender) 백엔드를 부르지 않게
  const sp = await searchParams;
  const dict = await getIngredients();
  const byId = new Map(dict.map((i) => [i.id, i]));
  const params = parseParams(sp, byId);
  // 목록 조건만의 key. 담은 제품(ids)·검색어만 바뀌면 목록·필터에 "불러오는 중"을 다시 띄우지 않는다(API는 getExplore 캐시)
  const listKey = String(toQuery(params));

  return (
    <>
      <nav aria-label="현재 위치" className="text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink">
          홈
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">성분별 제품 목록</span>
      </nav>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">성분별 제품 목록</h1>
      <p className="mt-1 text-ink-muted">고른 성분이 모두 든 제품을 1일 함량 순서로 보여줘요.</p>

      {params.ingredients.length === 0 ? (
        <>
          <Start dict={dict} params={params} />
          <div className="mt-8">
            <ProductSearch params={params} />
          </div>
        </>
      ) : (
        <>
          {/* 필터는 결과를 기다리지 않고 바로 보인다. 입력칸이 기본값을 쓰므로 조건이 바뀌면 key로 새로 그린다 */}
          <Filters key={listKey} params={params} dict={dict} byId={byId} />
          <div className="mt-8 flex flex-wrap items-start gap-8">
            <section className="min-w-0 flex-[999_1_560px]">
              <ProductSearch params={params} />
              {/* key가 바뀌면 새 경계라 조건·정렬·페이지가 바뀔 때 이전 결과 대신 "불러오는 중"을 보여준다 */}
              <Suspense key={listKey} fallback={<Loading />}>
                <Results params={params} />
              </Suspense>
            </section>
            <Guide />
          </div>
        </>
      )}

      <ComparePanel ids={params.ids} href={(ids) => compareHref(params, ids)} />
      {params.overflow && <OverflowNotice params={params} />}
    </>
  );
}

// 4개째를 담으려 할 때. 목록 중간에서 눌러도 보이게 화면 아래에 띄운다(스크롤을 지키는 링크라서).
// 클라이언트 코드 없이 닫기는 안내 없는 주소로 이동한다
function OverflowNotice({ params }: { params: Params }) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-xl flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-ink px-5 py-3.5 text-sm text-white shadow-card"
    >
      <p className="flex-1 basis-60">3개까지만 비교할 수 있어요. 하나를 빼고 추가해 주세요.</p>
      <a href="#compare" className="font-bold text-white underline">
        비교 칸 보기
      </a>
      <Link href={exploreHref(params)} scroll={false} className="text-white/80 hover:text-white">
        닫기
      </Link>
    </div>
  );
}

// 성분을 아직 고르지 않은 처음 화면
function Start({ dict, params }: { dict: IngredientItem[]; params: Params }) {
  const popular = POPULAR.flatMap((name) => dict.filter((i) => i.name === name));
  return (
    <section className="mt-8 rounded-hero bg-brand-50 px-6 py-12 text-center">
      <p className="text-lg font-bold text-ink">어떤 성분이 든 제품을 볼까요?</p>
      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {popular.map((i) => (
          <li key={i.id}>
            <Link
              href={exploreHref({ ...params, ingredients: [i.id] })}
              className="inline-flex h-9 items-center rounded-full border border-brand-200 bg-white px-4 text-sm font-bold text-ink-soft hover:border-brand-500 hover:text-brand-700"
            >
              {i.name}
            </Link>
          </li>
        ))}
      </ul>
      <form action="/explore" className="mt-6 inline-flex flex-wrap justify-center gap-2">
        <IngredientSelect name="ingredient" label="다른 성분 고르기" options={dict} required />
        <IdsInput ids={params.ids} />
        <QInput q={params.q} />
        <SubmitButton>보기</SubmitButton>
      </form>
    </section>
  );
}

// 조건은 모두 URL에 둔다. GET 폼이라 제출하면 /explore?ingredient=..&form=.. 로 이동만 한다(클라이언트 코드 없음).
// 고른 성분·제외 성분은 hidden으로 다시 보내고, 고른 select 값이 뒤에 붙어 추가된다(빈 값은 parseParams가 버린다)
function Filters({ params, dict, byId }: { params: Params; dict: IngredientItem[]; byId: Map<number, IngredientItem> }) {
  const base = byId.get(baseOf(params))!;
  // 함량 범위 단위. defaultUnit이 없는 성분은 단위가 섞이지 않아 기준값 단위와 같다(백엔드 데이터로 확인, 2026-11-11).
  // 기준값도 없는 성분(mg·CFU 등)은 결과의 단위를 쓴다
  const unit = base.defaultUnit ?? base.referenceUnit;
  const used = new Set([...params.ingredients, ...params.exclude]);
  const rest = dict.filter((i) => !used.has(i.id));
  const noReference = params.ingredients.map((id) => byId.get(id)!).filter((i) => i.referenceAmount === null);
  // 접힌 필터에 걸린 조건 수(제외 성분·제형·함량 범위·기준 충족)
  const active = [params.exclude.length > 0, params.forms.length > 0, params.min || params.max, params.meetsReference].filter(
    Boolean,
  ).length;

  return (
    <form action="/explore" className="mt-6 flex flex-col gap-4 rounded-panel border border-line bg-white p-5 shadow-card">
      <FilterRow label="고른 성분">
        {params.ingredients.map((id) => (
          <Chip
            key={id}
            label={byId.get(id)!.name}
            action="빼기"
            href={nextHref(params, { ingredients: params.ingredients.filter((x) => x !== id) })}
          />
        ))}
        {params.ingredients.map((id) => (
          <input key={id} type="hidden" name="ingredient" value={id} />
        ))}
        {params.ingredients.length < MAX_IDS && <IngredientSelect name="ingredient" label="+ 성분 추가" options={rest} />}
      </FilterRow>

      {/* 성분 칩만 두고 나머지 조건은 접어 둔다(DESIGN.md 8.2). 걸린 조건 수를 머리에 적어 접혀 있어도 알 수 있게 한다 */}
      {/* 조건이 걸려 있으면 펼친다. 적용한 조건이 바로 보이고, 잘못된 입력이 접힌 채 제출을 막지 않게 */}
      <details className="group" open={active > 0}>
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="transition-transform group-open:rotate-90">
            ›
          </span>
          필터 더 보기
          {active > 0 && <span className="text-brand-700">({active}개 적용 중)</span>}
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <FilterRow label="제외 성분">
            {params.exclude.map((id) => (
              <Chip
                key={id}
                label={byId.get(id)!.name}
                action="제외 해제"
                tone="neutral"
                href={nextHref(params, { exclude: params.exclude.filter((x) => x !== id) })}
              />
            ))}
            {params.exclude.map((id) => (
              <input key={id} type="hidden" name="exclude" value={id} />
            ))}
            {params.exclude.length < MAX_IDS && <IngredientSelect name="exclude" label="+ 제외할 성분" options={rest} />}
          </FilterRow>

          <FilterRow label="제형">
            {FORMS.map((f) => (
              <label
                key={f}
                className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line px-3.5 text-sm text-ink-soft has-checked:border-brand-700 has-checked:bg-brand-700 has-checked:font-bold has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-brand-700"
              >
                <input type="checkbox" name="form" value={f} defaultChecked={params.forms.includes(f)} className="sr-only" />
                {f}
              </label>
            ))}
          </FilterRow>

          {/* 함량 범위는 기준 성분 하나에만 걸린다(백엔드 baseIngredientId) */}
          <FilterRow label={`${base.name} 1일 함량`}>
            <AmountInput name="min" label="최소" defaultValue={params.min} />
            <span aria-hidden="true" className="text-ink-muted">
              ~
            </span>
            <AmountInput name="max" label="최대" defaultValue={params.max} />
            {unit ? (
              <span className="text-sm text-ink-muted">{unit}</span>
            ) : (
              <Suspense fallback={null}>
                <ResultUnit params={params} baseId={base.id} />
              </Suspense>
            )}
          </FilterRow>

          <FilterRow label="기준 충족">
            <label className={`inline-flex items-center gap-2 text-sm ${noReference.length ? "text-ink-muted" : "text-ink-soft"}`}>
              <input
                type="checkbox"
                name="meetsReference"
                value="true"
                defaultChecked={params.meetsReference}
                disabled={noReference.length > 0}
                className="size-4 accent-brand-700"
              />
              고른 성분 모두 1일 기준치 이상
            </label>
            {/* 기준값이 없는 성분을 고르면 확인할 수 없는 성분까지 "충족"으로 보이게 되어 끈다(DESIGN.md 8.2) */}
            {noReference.length > 0 && (
              <span className="text-xs text-ink-muted">{noReference.map((i) => i.name).join(", ")}에는 기준치가 없어요</span>
            )}
          </FilterRow>
        </div>
      </details>

      {params.sort && <input type="hidden" name="sort" value={params.sort} />}
      <IdsInput ids={params.ids} />
      <QInput q={params.q} />
      <div>
        <SubmitButton>조건 적용</SubmitButton>
      </div>
    </form>
  );
}

// 기준값이 없는 기준 성분의 단위. 결과 표와 같은 응답(getExplore)에서 찾는다
async function ResultUnit({ params, baseId }: { params: Params; baseId: number }) {
  const res = await getExplore(exploreQuery(params));
  if ("error" in res) return null;
  const unit = res.data.items
    .flatMap((it) => it.amounts.find((a) => a.ingredientId === baseId)?.values ?? [])
    .find((v) => v.dailyUnit)?.dailyUnit;
  return unit ? <span className="text-sm text-ink-muted">{unit}</span> : null;
}

async function Results({ params }: { params: Params }) {
  const res = await getExplore(exploreQuery(params));
  if ("error" in res) return <ExploreError params={params} error={res.error} />;
  const data = res.data;
  const lastPage = Math.min(Math.ceil(data.totalCount / PAGE_SIZE) - 1, MAX_PAGE);
  const sorts = [
    ...data.ingredients.map((ing, i) => ({ value: i === 0 ? "" : `amount:${ing.id}`, label: `${ing.name} 함량순` })),
    { value: "latest", label: "최신 신고순" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-extrabold text-ink">
          조건에 맞는 제품 <span className="tabular-nums text-brand-700">{data.totalCount.toLocaleString("ko-KR")}</span>개
        </h2>
        <nav aria-label="정렬" className="flex flex-wrap gap-1">
          {sorts.map((s) => (
            <Link
              key={s.value}
              href={nextHref(params, { sort: s.value })}
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
        <p className="mt-16 text-center text-ink-muted">조건에 맞는 제품이 없어요. 조건을 줄여 보세요.</p>
      ) : params.page > lastPage ? (
        // 공유 링크나 데이터가 줄어 마지막 페이지를 넘은 경우
        <p className="mt-16 text-center text-ink-muted">
          이 페이지에는 결과가 없어요.{" "}
          <Link href={exploreHref({ ...params, page: 0 })} className="font-bold text-brand-700">
            첫 페이지로
          </Link>
        </p>
      ) : (
        <ProductTable params={params} data={data} />
      )}

      <Pagination page={params.page} lastPage={lastPage} href={(page) => exploreHref({ ...params, page })} />
    </>
  );
}

// 넓은 표는 가로 스크롤 상자에 넣고 제품명 열을 고정한다(DESIGN.md 6.2)
function ProductTable({ params, data }: { params: Params; data: ProductExploreResponse }) {
  const base = data.ingredients.find((i) => i.id === data.baseIngredientId)!;
  // 막대는 기준 성분만, 이 페이지의 최댓값 대비(DESIGN.md 7.1)
  const barMax = Math.max(
    0,
    ...data.items.flatMap((it) =>
      (it.amounts.find((a) => a.ingredientId === base.id)?.values ?? []).map((v) => barValue(v, base) ?? 0),
    ),
  );

  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white shadow-card">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-line text-xs text-ink-muted">
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 font-medium shadow-[1px_0_0_var(--color-line-soft)]">
              제품
            </th>
            {data.ingredients.map((ing) => (
              <th key={ing.id} scope="col" className="min-w-40 px-4 py-3 font-medium">
                <span className="font-bold text-ink-soft">{ing.name}</span> 1일 함량
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={item.id} className="border-b border-line-soft last:border-b-0">
              <th
                scope="row"
                className="sticky left-0 z-10 w-[240px] min-w-[180px] bg-white px-4 py-4 align-top font-normal shadow-[1px_0_0_var(--color-line-soft)]"
              >
                <div className="flex gap-3">
                  <span className="w-6 shrink-0 pt-0.5 text-right text-sm font-bold tabular-nums text-ink-muted">
                    {params.page * PAGE_SIZE + i + 1}
                  </span>
                  <div className="min-w-0">
                    <Link href={`/products/${item.id}`} className="font-bold break-keep text-ink hover:text-brand-700 hover:underline">
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">{productMeta(item)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <BasisBadge basisCheck={item.basisCheck} explain={false} />
                      {item.parseStatus === "NEEDS_REVIEW" && <ReviewBadge />}
                    </div>
                    <AddButton params={params} id={item.id} />
                  </div>
                </div>
              </th>
              {/* 열 순서는 머리(data.ingredients)를 따른다. 응답 amounts 순서가 달라도 셀이 옆 열로 밀리지 않게 id로 찾는다 */}
              {data.ingredients.map((ing) => (
                <td key={ing.id} className="px-4 py-4 align-top">
                  <AmountCell
                    values={item.amounts.find((a) => a.ingredientId === ing.id)?.values ?? []}
                    ing={ing}
                    barMax={ing.id === base.id && barMax > 0 ? barMax : null}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 표 위 제품 검색(DESIGN.md 8.2). 목록에 원하는 제품이 없을 때 이름으로 찾아 담는다.
// 검색 응답에는 성분별 함량이 없어 순위 표에 섞지 않고 짧은 목록(5개)으로 따로 보여준다
function ProductSearch({ params }: { params: Params }) {
  const keep = toQuery(params);
  return (
    <div className="mb-6">
      {/* 입력칸이 기본값을 쓰므로 "검색 닫기" 등으로 검색어가 바뀌면 key로 새로 그린다 */}
      <form key={`form:${params.q}`} action="/explore" role="search" className="flex h-11 items-center gap-2 rounded-full border border-line bg-white pr-1.5 pl-4">
        <label htmlFor="compare-q" className="sr-only">
          비교에 담을 제품 검색
        </label>
        <input
          id="compare-q"
          name="q"
          type="search"
          defaultValue={params.q}
          required
          // 백엔드 최소·최대 길이(검색 API)와 맞춘다
          minLength={2}
          maxLength={100}
          placeholder="목록에 없는 제품은 이름으로 찾아 담아요"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-muted"
        />
        {/* 목록 조건과 담은 제품을 그대로 둔다 */}
        {[...keep].map(([k, v], i) => (
          <input key={i} type="hidden" name={k} value={v} />
        ))}
        <IdsInput ids={params.ids} />
        <button type="submit" className="h-8 shrink-0 rounded-full bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800">
          찾기
        </button>
      </form>
      {params.q && (
        <Suspense key={params.q} fallback={<p className="mt-3 text-sm text-ink-muted">찾는 중…</p>}>
          <ProductSearchResults params={params} />
        </Suspense>
      )}
    </div>
  );
}

async function ProductSearchResults({ params }: { params: Params }) {
  const res = await searchProducts(params.q);
  const close = (
    <Link href={exploreHref({ ...params, q: "" })} scroll={false} className="text-sm text-ink-muted hover:text-ink">
      검색 닫기
    </Link>
  );
  // 4xx(너무 짧은 검색어 등)는 백엔드 문구
  if ("error" in res) {
    return (
      <p role="alert" className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
        {res.error.details?.[0]?.reason ?? res.error.message} {close}
      </p>
    );
  }
  const { items, totalCount } = res.data;
  return (
    <div className="mt-3 rounded-card border border-line bg-white px-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft py-2.5 text-sm text-ink-muted">
        <span>
          &lsquo;{params.q}&rsquo; 제품 {totalCount.toLocaleString("ko-KR")}개
          {totalCount > SEARCH_SIZE && ` 중 ${SEARCH_SIZE}개. 더 정확한 이름으로 찾아 보세요`}
        </span>
        {close}
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">찾는 제품이 없어요.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line-soft py-3 last:border-b-0">
              <div className="min-w-0 flex-1 basis-56">
                <Link href={`/products/${item.id}`} className="font-bold break-keep text-ink hover:text-brand-700 hover:underline">
                  {item.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink-muted">{productMeta(item)}</p>
              </div>
              <AddButton params={params} id={item.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// "비교에 추가" 링크. 3개가 찼어도 링크는 두고, 4개째는 parseParams가 받지 않고 안내한다(DESIGN.md 8.3).
// 스크롤을 지켜 목록에서 연달아 담을 수 있게 한다
function AddButton({ params, id }: { params: Params; id: number }) {
  if (params.ids.includes(id)) {
    return <span className="mt-2 inline-flex h-8 items-center text-sm font-bold text-ink-muted">✓ 담김</span>;
  }
  return (
    <Link
      href={compareHref(params, [...params.ids, id])}
      scroll={false}
      className="mt-2 inline-flex h-8 items-center rounded-full border border-brand-500 px-3 text-sm font-bold text-brand-700 hover:bg-brand-50"
    >
      + 비교에 추가
    </Link>
  );
}

// 4xx는 백엔드 문구를 그대로(ErrorCode.message는 사용자에게 보여도 되는 문장만). 5xx는 api()가 던져 error.tsx로
function ExploreError({ params, error }: { params: Params; error: ErrorBody }) {
  return (
    <div role="alert" className="mt-10 text-center text-ink-muted">
      <p>{error.details?.[0]?.reason ?? error.message}</p>
      <Link
        href={exploreHref({ ...params, exclude: [], forms: [], min: "", max: "", meetsReference: false, sort: "", page: 0 })}
        className="mt-3 inline-block font-bold text-brand-700"
      >
        고른 성분만 남기고 조건 지우기
      </Link>
    </div>
  );
}

// 비교 기준 설명과 배지 범례(DESIGN.md 8.2 사이드 안내). 순위가 효능 평가로 읽히지 않게 적는다
function Guide() {
  return (
    <aside className="flex-[1_1_280px] rounded-panel bg-brand-50 p-6 text-sm leading-relaxed text-ink-soft">
      <h2 className="text-base font-extrabold text-ink">이렇게 비교해요</h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4">
        <li>고른 성분이 모두 든 제품만 보여주고, 제외 성분이 하나라도 든 제품은 빼요.</li>
        <li>순서는 고른 성분 하나의 1일 함량 순서예요. 제품이 더 좋다는 뜻은 아니에요.</li>
        <li>막대는 이 페이지에서 가장 많은 값에 견준 길이예요.</li>
        <li>기준치는 비타민·무기질은 영양성분 기준치, 기능성 원료는 식약처 고시 1일 섭취량의 최솟값이에요.</li>
        <li>같은 성분이 여러 번 적힌 제품(멀티팩 등)은 합치지 않고 따로 보여줘요.</li>
        <li>1일 함량을 계산하지 못한 값은 성분표 원문(기준량당)을 그대로 보여줘요.</li>
      </ul>
      <h3 className="mt-6 font-extrabold text-ink">배지</h3>
      <dl className="mt-3 flex flex-col gap-3">
        <Legend badge={<BasisBadge basisCheck="DAILY" />}>하루 섭취량 기준으로 확인한 함량이에요.</Legend>
        <Legend badge={<BasisBadge basisCheck={null} explain={false} />}>
          제품 성분표에 적힌 기준량당 함량이에요. 하루 섭취량과 같은지 확인하지 못했어요.
        </Legend>
        <Legend badge={<ReviewBadge />}>값이 이상해 검수를 기다리고 있어요. 원문과 다를 수 있어요.</Legend>
        <Legend badge={<OtherUnitBadge />}>다른 단위로 적혀 있어 기준치·다른 제품과 견주지 않아요.</Legend>
      </dl>
    </aside>
  );
}

function Legend({ badge, children }: { badge: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt>{badge}</dt>
      <dd className="mt-1 text-xs text-ink-muted">{children}</dd>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
      <legend className="float-left text-sm font-bold text-ink sm:py-2">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ label, action, href, tone = "brand" }: { label: string; action: string; href: string; tone?: "brand" | "neutral" }) {
  return (
    <Link
      href={href}
      aria-label={`${label} ${action}`}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ${
        tone === "brand"
          ? "bg-brand-700 text-white hover:bg-brand-800 hover:text-white"
          : "bg-neutral-bg text-neutral-fg hover:text-ink"
      }`}
    >
      {label}
      <span aria-hidden="true">✕</span>
    </Link>
  );
}

function IngredientSelect({ name, label, options, required }: { name: string; label: string; options: IngredientItem[]; required?: boolean }) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue=""
      required={required}
      className="h-9 w-44 max-w-full rounded-full border border-line bg-white px-3 text-sm text-ink-soft"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function AmountInput({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <input
      type="number"
      name={name}
      aria-label={label}
      placeholder={label}
      defaultValue={defaultValue}
      min={0}
      step="any"
      inputMode="decimal"
      className="h-9 w-28 rounded-full border border-line px-3.5 text-sm tabular-nums"
    />
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="h-9 rounded-full bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">
      {children}
    </button>
  );
}

// GET 폼이 담은 제품을 잃지 않게 다시 보낸다
function IdsInput({ ids }: { ids: number[] }) {
  return ids.length ? <input type="hidden" name="ids" value={ids.join(",")} /> : null;
}

// 검색어도 같은 이유로 다시 보낸다
function QInput({ q }: { q: string }) {
  return q ? <input type="hidden" name="q" value={q} /> : null;
}

function Loading() {
  return <p className="mt-10 text-center text-ink-muted">불러오는 중…</p>;
}

// 함량순·함량 범위가 걸린 성분
function baseOf(p: Params) {
  return sortIdOf(p.sort) ?? p.ingredients[0];
}

// "amount:{id}"의 id. 다른 정렬이면 null
function sortIdOf(sort: string) {
  return sort.startsWith("amount:") ? Number(sort.slice("amount:".length)) : null;
}

function parseParams(sp: Record<string, string | string[] | undefined>, byId: Map<number, IngredientItem>): Params {
  const all = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const one = (v: string | string[] | undefined) => all(v)[0] ?? "";
  // 없는 성분·중복·빈 값(고르지 않은 select)은 버린다
  const ids = (v: string | string[] | undefined) =>
    [...new Set(all(v).filter((s) => /^\d{1,15}$/.test(s)).map(Number))].filter((id) => byId.has(id)).slice(0, MAX_IDS);
  // type=number 입력이 보내는 0 이상 숫자(".5", "1e3" 포함, 백엔드 BigDecimal이 그대로 읽음). 그 밖의 값은 조건 없음
  const amount = (v: string | string[] | undefined) => {
    const s = one(v).trim();
    return /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s) ? s : "";
  };

  const ingredients = ids(sp.ingredient);
  const compareIds = [
    ...new Set(
      all(sp.ids)
        .flatMap((s) => s.split(","))
        .filter((s) => /^\d{1,15}$/.test(s))
        .map(Number),
    ),
  ];
  // ids=12,34 (같은 이름이 여러 번 와도 이어 붙인다). 숫자 아닌 값·중복은 버린다. 없는 제품은 비교 칸이 백엔드 문구로 알려준다.
  // id는 15자리까지만(Number가 2^53을 넘으면 다른 수로 바뀜)
  const keep = {
    ids: compareIds.slice(0, MAX_COMPARE),
    overflow: compareIds.length > MAX_COMPARE,
    // 백엔드 최대 길이(100자)를 넘으면 자른다. 너무 짧은 검색어는 백엔드 문구로 알려준다
    q: one(sp.q).trim().slice(0, 100),
  };
  // 성분을 고르지 않은 처음 화면에서는 목록 조건(page·form 등)이 보이지 않으니 버린다. 성분을 고를 때 그대로 따라가지 않게
  if (ingredients.length === 0) return { ...EMPTY, ...keep };

  const sortRaw = one(sp.sort);
  const sortId = sortIdOf(sortRaw);
  const page = Number.parseInt(one(sp.page), 10);
  return {
    ingredients,
    exclude: ids(sp.exclude).filter((id) => !ingredients.includes(id)),
    forms: [...new Set(all(sp.form))].filter((f) => FORMS.includes(f)),
    min: amount(sp.min),
    max: amount(sp.max),
    // 기준값이 없는 성분이 섞이면 백엔드가 거절한다. 그 성분을 방금 추가한 경우라 조용히 끈다(체크박스도 꺼져 보인다)
    meetsReference: one(sp.meetsReference) === "true" && ingredients.every((id) => byId.get(id)!.referenceAmount !== null),
    // 첫 성분 함량순은 기본값("")으로 맞춘다. 고르지 않은 성분 기준이면 기본값
    sort: sortRaw === "latest" ? "latest" : sortId !== null && ingredients.indexOf(sortId) > 0 ? sortRaw : "",
    page: Number.isInteger(page) && page >= 0 ? Math.min(page, MAX_PAGE) : 0,
    ...keep,
  };
}

// 조건을 바꾸는 링크. 첫 페이지로 돌아가고, 기준 성분이 바뀌면 함량 범위(그 성분의 값·단위)를 비운다
function nextHref(p: Params, change: Partial<Params>) {
  const n: Params = { ...p, page: 0, ...change };
  // 마지막 성분을 빼면 처음 화면이다. 거기서는 다른 조건이 보이지 않아 남기지 않는다
  if (n.ingredients.length === 0) return exploreHref({ ...EMPTY, ids: p.ids, q: p.q });
  const sortId = sortIdOf(n.sort);
  if (sortId !== null && n.ingredients.indexOf(sortId) <= 0) n.sort = "";
  if (baseOf(n) !== baseOf(p)) {
    n.min = "";
    n.max = "";
  }
  return exploreHref(n);
}

// 화면 주소. 목록 조건(toQuery)에 담은 제품을 더한다. ids는 쉼표가 %2C로 바뀌지 않게 직접 붙인다
function exploreHref(p: Params) {
  const q = String(toQuery(p));
  const ids = p.ids.length ? `ids=${p.ids.join(",")}` : "";
  const search = p.q ? String(new URLSearchParams({ q: p.q })) : "";
  const query = [q, search, ids].filter(Boolean).join("&");
  return query ? `/explore?${query}` : "/explore";
}

// 담은 제품을 바꾸는 링크("비교에 추가"·"빼기"). 목록 조건·페이지는 그대로 둔다
function compareHref(p: Params, ids: number[]) {
  return exploreHref({ ...p, ids });
}

// 목록 API 조건. URL과 API가 같은 이름을 쓴다(ProductController.explore)
function toQuery(p: Params) {
  const sp = new URLSearchParams();
  p.ingredients.forEach((id) => sp.append("ingredient", String(id)));
  p.exclude.forEach((id) => sp.append("exclude", String(id)));
  p.forms.forEach((f) => sp.append("form", f));
  if (p.min) sp.set("min", p.min);
  if (p.max) sp.set("max", p.max);
  if (p.meetsReference) sp.set("meetsReference", "true");
  if (p.sort) sp.set("sort", p.sort);
  if (p.page > 0) sp.set("page", String(p.page));
  return sp;
}
