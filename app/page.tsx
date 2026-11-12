import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AmountCell, barValue } from "@/components/AmountCell";
import { ReviewBadge } from "@/components/badges";
import { SearchBar } from "@/components/SearchBar";
import { productMeta } from "@/lib/format";
import { getExplore, getIngredients } from "@/lib/queries";
import type { IngredientItem } from "@/types/api";

// 인기 성분(고정). 연결된 제품 수가 많은 순서(로컬 DB, 2026-11-12). id는 환경마다 다를 수 있어 이름으로 찾는다.
// 조회 기반 순위는 백엔드 PLANNING.md "메인 인기 성분" 2단계에서 만들고, 기록이 쌓이면 이 목록을 API로 바꾼다
const POPULAR = ["아연", "비타민 D", "비타민 B6", "비타민 B1", "비타민 B2", "비타민 C"];
// 카드마다 보여줄 제품 수
const TOP = 3;

export default function Home() {
  return (
    <main>
      <div className="bg-brand-50">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-24 text-center">
          <h1 className="text-[40px] font-extrabold tracking-tight text-ink">어떤 영양제가 궁금하세요?</h1>
          <p className="mt-3 text-ink-muted">식약처 공공데이터로 성분과 함량을 한눈에 비교해 드려요</p>
          <div className="mt-8 w-full max-w-[660px]">
            <SearchBar size="hero" />
          </div>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-6 py-14">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">인기 성분 비교</h2>
        <p className="mt-1 text-ink-muted">많이 찾는 성분의 1일 함량 상위 제품이에요.</p>
        <Suspense fallback={<Message>불러오는 중…</Message>}>
          <PopularCards />
        </Suspense>
      </section>
    </main>
  );
}

async function PopularCards() {
  // 요청 때 그린다. 빌드 때(prerender) 백엔드를 부르면 백엔드 없는 CI에서 빌드가 깨진다
  await connection();
  let dict: IngredientItem[];
  try {
    dict = await getIngredients();
  } catch {
    // 메인 전체를 에러 화면으로 바꾸지 않는다. 검색 히어로는 그대로 쓸 수 있게
    return <Message>인기 성분을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Message>;
  }
  const ingredients = POPULAR.flatMap((name) => dict.filter((i) => i.name === name));

  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ingredients.map((ing) => (
        <li key={ing.id} className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card">
          <h3 className="text-lg font-extrabold text-ink">{ing.name}</h3>
          {/* 카드마다 경계를 둬 한 성분이 늦거나 실패해도 나머지 카드는 보인다 */}
          <Suspense fallback={<p className="mt-4 flex-1 text-sm text-ink-muted">불러오는 중…</p>}>
            <TopProducts ing={ing} />
          </Suspense>
          <Link href={`/explore?ingredient=${ing.id}`} className="mt-4 self-start text-sm font-bold text-brand-700 hover:underline">
            {ing.name} 제품 더 보기 →
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function TopProducts({ ing }: { ing: IngredientItem }) {
  let res;
  try {
    // /explore에서 이 성분만 고른 첫 페이지와 같은 쿼리라 "더 보기"를 누르면 서버 캐시를 그대로 쓴다
    res = await getExplore(`ingredient=${ing.id}&size=10`);
  } catch {
    return <p className="mt-4 flex-1 text-sm text-ink-muted">불러오지 못했어요.</p>;
  }
  if ("error" in res) return <p className="mt-4 flex-1 text-sm text-ink-muted">{res.error.message}</p>;
  const items = res.data.items.slice(0, TOP);
  if (items.length === 0) return <p className="mt-4 flex-1 text-sm text-ink-muted">아직 제품이 없어요.</p>;
  const values = (id: number) => items.find((it) => it.id === id)?.amounts.find((a) => a.ingredientId === ing.id)?.values ?? [];
  // 막대는 이 카드 3개 중 최댓값 대비. 오류 의심·다른 단위 값은 빼고 센다(DESIGN.md 7.1)
  const barMax = Math.max(0, ...items.flatMap((it) => values(it.id).map((v) => barValue(v, ing) ?? 0)));

  return (
    <ol className="mt-4 flex flex-1 flex-col gap-4">
      {items.map((item, i) => (
        <li key={item.id} className="flex gap-3">
          <span className="w-4 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-ink-muted">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${item.id}`} className="font-bold break-keep text-ink hover:text-brand-700 hover:underline">
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink-muted">{productMeta({ manufacturer: item.manufacturer, form: item.form })}</p>
            {item.parseStatus === "NEEDS_REVIEW" && (
              <div className="mt-1.5">
                <ReviewBadge />
              </div>
            )}
            <div className="mt-2">
              <AmountCell values={values(item.id)} ing={ing} barMax={barMax > 0 ? barMax : null} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="mt-10 text-center text-ink-muted">{children}</p>;
}
