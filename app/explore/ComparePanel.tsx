import Link from "next/link";
import { Suspense } from "react";
import { AmountCell, barValue } from "@/components/AmountCell";
import { BasisBadge, ReviewBadge } from "@/components/badges";
import { api } from "@/lib/api";
import { productMeta } from "@/lib/format";
import type { CompareIngredient, CompareProduct, ProductCompareResponse, ProductDetailResponse } from "@/types/api";

// 담은 제품 순서대로 A/B/C 색(DESIGN.md 2.3)
const SERIES = [
  { letter: "A", bg: "bg-series-a", border: "border-series-a" },
  { letter: "B", bg: "bg-series-b", border: "border-series-b" },
  { letter: "C", bg: "bg-series-c", border: "border-series-c" },
];

type Props = {
  ids: number[];
  // 담은 제품을 바꾼 화면 주소. 목록 조건은 page.tsx가 붙인다
  href: (ids: number[]) => string;
};

// DESIGN.md 8.3 담은 제품 비교. 0개 안내, 1개 "하나 더", 2~3개 비교 표
export function ComparePanel({ ids, href }: Props) {
  return (
    <section id="compare" aria-labelledby="compare-title" className="mt-12 scroll-mt-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="compare-title" className="text-xl font-extrabold text-ink">
          담은 제품 비교
        </h2>
        <span className="text-sm tabular-nums text-ink-muted">{ids.length} / 3</span>
        {ids.length > 0 && (
          <Link href={href([])} scroll={false} className="ml-auto text-sm text-ink-muted hover:text-ink">
            모두 빼기
          </Link>
        )}
      </div>
      {ids.length === 0 ? (
        <Empty>위 목록이나 검색에서 제품을 담아 보세요. 3개까지 나란히 비교할 수 있어요.</Empty>
      ) : (
        // 담은 제품이 바뀌면 이전 표 대신 "불러오는 중"을 보여준다
        <Suspense key={ids.join(",")} fallback={<Empty>불러오는 중…</Empty>}>
          {ids.length === 1 ? <One id={ids[0]} href={href} /> : <Table ids={ids} href={href} />}
        </Suspense>
      )}
    </section>
  );
}

// 하나만 담았을 때. 비교 API는 2개부터라 상세 API로 이름만 보여준다
async function One({ id, href }: { id: number; href: Props["href"] }) {
  const res = await api<ProductDetailResponse>(`/api/products/${id}`);
  const remove = href([]);
  if ("error" in res) {
    return (
      <Empty>
        담은 제품을 찾을 수 없어요.{" "}
        <Link href={remove} scroll={false} className="font-bold text-brand-700">
          빼기
        </Link>
      </Empty>
    );
  }
  return (
    <div className="mt-4 flex flex-wrap items-start gap-4">
      <div className="w-64 max-w-full rounded-card border border-line bg-white p-4 shadow-card">
        <ProductHead p={res.data} index={0} remove={remove} />
      </div>
      <p className="flex min-h-32 flex-1 basis-64 items-center justify-center rounded-card border border-dashed border-line px-4 text-center text-ink-muted">
        하나 더 담아 주세요. 2개부터 비교할 수 있어요.
      </p>
    </div>
  );
}

async function Table({ ids, href }: { ids: number[]; href: Props["href"] }) {
  const res = await api<ProductCompareResponse>(`/api/products/compare?ids=${ids.join(",")}`);
  // 4xx는 백엔드 문구(없는 제품 등). 어느 제품인지는 문구에만 있어, 정상 제품을 남길 수 있게 하나씩 빼는 링크를 둔다.
  // 5xx는 api()가 던져 error.tsx로
  if ("error" in res) {
    return (
      <div role="alert" className="mt-4 rounded-card border border-dashed border-line px-4 py-8 text-center text-ink-muted">
        <p>{res.error.details?.[0]?.reason ?? res.error.message}</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {ids.map((id) => (
            <li key={id}>
              <Link href={href(ids.filter((x) => x !== id))} scroll={false} className="font-bold text-brand-700">
                제품 {id} 빼기
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const { products, ingredients } = res.data;

  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white shadow-card">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 align-bottom text-xs font-medium text-ink-muted shadow-[1px_0_0_var(--color-line-soft)]">
              성분 (1일 함량)
            </th>
            {products.map((p, i) => (
              <th key={p.id} scope="col" className="min-w-52 px-4 py-4 align-top font-normal">
                <ProductHead p={p} index={i} remove={href(ids.filter((x) => x !== p.id))} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => {
            const max = rowMax(ing);
            return (
              <tr key={ing.ingredientId ?? `raw:${ing.name}`} className="border-b border-line-soft last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-40 min-w-32 bg-white px-4 py-3 align-top text-sm font-bold break-keep text-ink-soft shadow-[1px_0_0_var(--color-line-soft)]"
                >
                  {ing.name}
                </th>
                {ing.values.map((values, i) => {
                  const top = max?.highlight && values.length === 1 && barValue(values[0], ing) === max.value;
                  return (
                    <td key={products[i].id} className={`px-4 py-3 align-top ${top ? "bg-brand-50" : ""}`}>
                      <AmountCell values={values} ing={ing} barMax={max ? max.value : null} />
                      {/* 색만으로 구분하지 않게 글자도 단다(DESIGN.md 2.2) */}
                      {top && <p className="mt-1 text-xs font-bold text-brand-700">가장 많음</p>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 담은 제품 머리: A/B/C · 제조사 · 제품명 · 제형 · 배지 · 빼기.
// manufacturer는 위탁생산 제조사라 브랜드 자리에 두지 않고 "제조사"로 적는다(브랜드는 API에 생기면 이름 위에 둔다)
function ProductHead({ p, index, remove }: { p: CompareProduct; index: number; remove: string }) {
  const s = SERIES[index];
  return (
    <div className={`border-t-4 pt-3 ${s.border}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-extrabold text-white ${s.bg}`}>
          {s.letter}
        </span>
        <Link href={remove} scroll={false} aria-label={`${p.name} 빼기`} className="text-sm text-ink-muted hover:text-ink">
          빼기 <span aria-hidden="true">✕</span>
        </Link>
      </div>
      <Link href={`/products/${p.id}`} className="mt-2 block font-bold break-keep text-ink hover:text-brand-700 hover:underline">
        {p.name}
      </Link>
      <p className="mt-0.5 text-xs text-ink-muted">
        {productMeta(p)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <BasisBadge basisCheck={p.basisCheck} explain={false} />
        {p.parseStatus === "NEEDS_REVIEW" && <ReviewBadge />}
      </div>
    </div>
  );
}

// 막대·"가장 많음"을 쓸 수 있는 행이면 최댓값. 든 제품이 2개 이상이고, 제품마다 그 성분 행이 하나이며,
// 모두 막대로 견줄 수 있는 값(1일 함량 있음, 오류 의심 아님, 주 단위)이고 단위가 같을 때만(DESIGN.md 8.3).
// 멀티팩처럼 행이 여러 개면 합산이 맞는지 알 수 없어 견주지 않는다
function rowMax(ing: CompareIngredient) {
  const cells = ing.values.filter((v) => v.length > 0);
  if (cells.length < 2 || cells.some((v) => v.length !== 1)) return null;
  const nums = cells.map((v) => barValue(v[0], ing));
  if (nums.some((n) => n === null)) return null;
  if (new Set(cells.map((v) => v[0].dailyUnit)).size !== 1) return null;
  const value = Math.max(...(nums as number[]));
  // 모두 같으면 "가장 많음"을 달지 않는다(막대만)
  return { value, highlight: nums.some((n) => n !== value) };
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-card border border-dashed border-line px-4 py-10 text-center text-ink-muted">{children}</p>
  );
}
