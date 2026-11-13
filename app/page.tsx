import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AmountCell, barMaxOf } from "@/components/AmountCell";
import { BasisBadge, BrandLabel, ExportBadge, ReviewBadge } from "@/components/badges";
import { Carousel } from "@/components/Carousel";
import { SearchBar } from "@/components/SearchBar";
import { productMeta } from "@/lib/format";
import { getExplore, getIngredients } from "@/lib/queries";
import type { IngredientItem } from "@/types/api";

// 인기 성분(고정). 연결된 제품 수가 많은 순서(로컬 DB, 2026-11-12). id는 환경마다 다를 수 있어 이름으로 찾는다.
// 조회 기반 순위는 백엔드 PLANNING.md "메인 인기 성분" 2단계에서 만들고, 기록이 쌓이면 이 목록을 API로 바꾼다
const POPULAR = ["아연", "비타민 D", "비타민 B6", "비타민 B1", "비타민 B2", "비타민 C"];
// 카드마다 보여줄 제품 수
const TOP = 3;
// 히어로 검색창 아래 칩(초안 1번 그대로). 검색어로 넘겨 성분명·제품명 어느 쪽이든 찾게 한다(오메가3·유산균은 사전 성분명이 아님)
const HERO_CHIPS = ["비타민D", "마그네슘", "오메가3", "루테인", "유산균"];

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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-bold text-ink-soft">인기 성분</span>
            {HERO_CHIPS.map((q) => (
              <Link
                key={q}
                href={`/search?${new URLSearchParams({ q })}`}
                className="inline-flex h-9 items-center rounded-full border border-line bg-white px-4 text-sm text-ink-soft hover:border-brand-500 hover:text-brand-700"
              >
                # {q}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-6 pt-10">
        <Shortcuts />
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-6 py-14">
        {/* 6개를 한 번에 펼치면 두 줄로 길어져 한 줄(넓은 화면 3개)씩 넘겨 본다 */}
        <Carousel
          label="인기 성분"
          heading={
            <>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">인기 성분 비교</h2>
              <p className="mt-1 text-ink-muted">많이 찾는 성분의 1일 함량 상위 제품이에요.</p>
            </>
          }
        >
          <Suspense fallback={<Message>불러오는 중…</Message>}>
            <PopularCards />
          </Suspense>
        </Carousel>
      </section>

      {/* 초안 1번 배치: 왼쪽 영양제 소식, 오른쪽 공식 데이터. 좁으면 위아래로 쌓인다 */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-6 px-6 pb-14">
        <News />
        <OfficialData />
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-6 pb-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">사용자 후기</h2>
        <Reviews />
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
  } catch (e) {
    // 메인 전체를 에러 화면으로 바꾸지 않는다(검색 히어로는 그대로 쓸 수 있게). 장애를 알 수 있게 서버 로그는 남긴다
    console.error("메인 인기 성분: 성분 사전을 불러오지 못했습니다", e);
    return <Message>인기 성분을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Message>;
  }
  const ingredients = POPULAR.flatMap((name) => dict.filter((i) => i.name === name));
  // 사전 이름이 바뀌면 카드가 조용히 빠진다. 알아챌 수 있게 로그를 남긴다
  const missing = POPULAR.filter((name) => !ingredients.some((i) => i.name === name));
  if (missing.length > 0) console.error("메인 인기 성분: 사전에 없는 이름", missing);
  if (ingredients.length === 0) return <Message>인기 성분을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Message>;

  return (
    // 한 화면에 폰 1개(옆 카드가 살짝 보여 넘길 수 있음을 알림), 중간 2개, 넓은 화면 3개. 간격 20px(gap-5)을 빼고 나눈다
    <ul className="flex gap-5">
      {ingredients.map((ing) => (
        <li
          key={ing.id}
          className="flex w-[85%] shrink-0 snap-start flex-col rounded-card border border-line bg-white p-5 shadow-card sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]"
        >
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
  } catch (e) {
    console.error(`메인 인기 성분: ${ing.name} 목록을 불러오지 못했습니다`, e);
    return <p className="mt-4 flex-1 text-sm text-ink-muted">불러오지 못했어요.</p>;
  }
  if ("error" in res) return <p className="mt-4 flex-1 text-sm text-ink-muted">{res.error.message}</p>;
  const items = res.data.items.slice(0, TOP);
  if (items.length === 0) return <p className="mt-4 flex-1 text-sm text-ink-muted">아직 제품이 없어요.</p>;
  const rows = items.map((item) => ({ item, values: item.amounts.find((a) => a.ingredientId === ing.id)?.values ?? [] }));
  // 막대는 이 카드 3개 중 최댓값 대비. 오류 의심·다른 단위 값은 빼고 센다(DESIGN.md 7.1)
  const barMax = barMaxOf(rows.map((r) => r.values), ing);

  return (
    <ol className="mt-4 flex flex-1 flex-col gap-4">
      {rows.map(({ item, values }, i) => (
        <li key={item.id} className="flex gap-3">
          <span className="w-4 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-ink-muted">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <BrandLabel brand={item.brand} name={item.name} />
            <Link href={`/products/${item.id}`} className="font-bold break-keep text-ink hover:text-brand-700 hover:underline">
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink-muted">{productMeta({ manufacturer: item.manufacturer, form: item.form })}</p>
            {/* 함량 옆에 항상 표시 기준 배지(DESIGN.md 7.3). 메인에는 배지 범례가 없어 설명을 펼칠 수 있게 둔다(카드는 스크롤 상자가 아니라 잘리지 않음).
                오류 의심 값은 함량 칸이 "검수 대기"를 달아 겹치지 않게 뺀다 */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <BasisBadge basisCheck={item.basisCheck} />
              {item.parseStatus === "NEEDS_REVIEW" && !values.some((v) => v.exceedsUpperLimit) && <ReviewBadge />}
              {item.exportOnly && <ExportBadge />}
            </div>
            <div className="mt-2">
              <AmountCell values={values} ing={ing} barMax={barMax} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// 초안 1번 바로가기 4칸. 기능이 없는 칸은 DESIGN.md 7.7 "준비 중"(점선 + 노랑 배지, 링크 없음).
// 기능이 생기면 href를 채운다(내 서랍·회수 알림은 로그인 뒤, AI 도우미는 API 뒤)
const SHORTCUTS: { title: string; desc: string; href?: string; tone: string; icon: React.ReactNode }[] = [
  {
    title: "성분 비교하기",
    desc: "함량을 나란히",
    href: "/explore",
    tone: "bg-brand-50 text-brand-700",
    icon: <path d="M5 7h14M5 12h10M5 17h6" />,
  },
  {
    title: "내 서랍",
    desc: "먹는 영양제 모아보기",
    tone: "bg-ok-bg text-ok-fg",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 12h16M10 15.5h4" />
      </>
    ),
  },
  {
    title: "회수 알림",
    desc: "이메일로 바로",
    tone: "bg-recall-bg text-recall-icon",
    icon: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4" />,
  },
  {
    title: "AI 도우미에게 묻기",
    desc: "모르는 성분 질문",
    tone: "bg-warn-bg text-warn-fg",
    icon: <path d="M4 5h16v11H9l-5 4zM9 10.5h.01M12 10.5h.01M15 10.5h.01" />,
  },
];

function Shortcuts() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
      {SHORTCUTS.map((s) => {
        const body = (
          <>
            <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-[14px] ${s.tone}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                {s.icon}
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-ink">{s.title}</span>
              <span className="mt-0.5 block text-sm text-ink-muted">{s.desc}</span>
            </span>
          </>
        );
        return (
          <li key={s.title}>
            {s.href ? (
              <Link href={s.href} className="flex h-full items-center gap-4 rounded-card border border-line bg-white p-5 shadow-card hover:border-brand-500">
                {body}
              </Link>
            ) : (
              // 누를 수 없는 칸. 링크가 아니라 키보드 초점도 받지 않는다
              <div aria-disabled="true" className="relative flex h-full items-center gap-4 rounded-card border-2 border-dashed border-line bg-white p-5">
                {body}
                {/* 제목이 길어도 줄바꿈되지 않게 오른쪽 위에 둔다 */}
                <span className="absolute top-2.5 right-2.5 rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-bold text-warn-fg">준비 중</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// 초안 1번 "영양제 소식"(회수·공지·기사). 최근 회수 목록 API가 없어 준비 중 칸(DESIGN.md 7.7).
// 회수 API가 생기면 회수부터 목록으로 채운다(PROGRESS.md "백엔드에 걸린 것")
function News() {
  return (
    <section className="min-w-0 flex-[999_1_480px]">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">영양제 소식</h2>
        {/* 초안 1번 "더 보기". 소식 전체 화면(/news)과 API가 생기면 링크로 바꾼다. 지금은 갈 곳이 없어 누를 수 없게 둔다 */}
        <span aria-disabled="true" className="cursor-not-allowed text-sm font-bold text-ink-muted">
          더 보기
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center rounded-card border-2 border-dashed border-line px-6 py-10 text-center">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-surface text-ink-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="M5 4h11v16H6a1 1 0 0 1-1-1zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3" />
          </svg>
        </span>
        <span className="mt-4 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-bold text-warn-fg">준비 중</span>
        <p className="mt-3 font-bold text-ink">영양제 소식을 준비하고 있어요</p>
        <p className="mt-1 text-sm text-ink-muted">식약처 회수 소식과 공지를 곧 모아 보여드려요</p>
      </div>
    </section>
  );
}

// 초안 1번 "공식 데이터로 만들어요". 초안의 수록 제품 수·데이터 기준일 칸은 내려주는 API가 없어 고정 문구 두 칸만 둔다(PROGRESS.md "메인 초안 1번 나머지")
function OfficialData() {
  return (
    <section className="flex-[1_1_340px] rounded-panel bg-brand-50 p-6">
      <h2 className="text-xl font-extrabold tracking-tight text-ink">공식 데이터로 만들어요</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">식품의약품안전처 식품안전나라 공공데이터를 그대로 옮겨 보여드려요.</p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <StatCard value="매일" label="데이터 갱신" />
        <StatCard value="식약처" label="모든 화면에 출처 표기" />
      </dl>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-card bg-white px-5 py-4">
      <dt className="mt-1 text-sm text-ink-muted">{label}</dt>
      <dd className="text-2xl font-extrabold text-brand-700">{value}</dd>
    </div>
  );
}

// 후기 API가 없어 준비 중 칸(DESIGN.md 7.7: 점선 테두리 + 노랑 "준비 중" 배지 + disabled)
function Reviews() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-card border-2 border-dashed border-line px-6 py-12 text-center">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-surface text-ink-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="size-5">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
      </span>
      <span className="mt-4 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-bold text-warn-fg">준비 중</span>
      <p className="mt-3 font-bold text-ink">후기 기능을 준비하고 있어요</p>
      <p className="mt-1 text-sm text-ink-muted">알꾼이를 써 본 이야기를 곧 남길 수 있어요</p>
      <button
        type="button"
        disabled
        className="mt-5 h-10 cursor-not-allowed rounded-full border border-line px-5 text-sm font-bold text-ink-muted"
      >
        첫 후기 남기기
      </button>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="my-6 text-center text-ink-muted">{children}</p>;
}
