import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TAGS, UNKNOWN_TAG } from "@/components/NewsList";
import { Pagination } from "@/components/Pagination";
import { getNews } from "@/lib/queries";
import type { NewsItem } from "@/types/api";

export const metadata: Metadata = {
  title: "영양제 소식",
  description: "식약처가 알린 건강기능식품 회수 소식을 최신순으로 모아 보여드려요",
};

const PAGE_SIZE = 20;
// 백엔드 page 상한(NewsController MAX_PAGE)
const MAX_PAGE = 500;

// searchParams는 요청 때만 알 수 있어 Suspense 안에서 읽는다(cacheComponents). 바깥 틀은 미리 만들어진다
export default function NewsPage(props: PageProps<"/news">) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">영양제 소식</h1>
      <p className="mt-1 text-sm text-ink-muted">식약처가 알린 건강기능식품 회수 소식이에요. 회수는 적힌 소비기한의 제품만 해당될 수 있어요.</p>
      <Suspense fallback={<p className="mt-10 text-center text-ink-muted">불러오는 중…</p>}>
        <NewsContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function NewsContent({ searchParams }: { searchParams: PageProps<"/news">["searchParams"] }) {
  const raw = (await searchParams).page;
  const parsed = Number.parseInt((Array.isArray(raw) ? raw[0] : raw) ?? "", 10);
  const page = Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, MAX_PAGE) : 0;

  return (
    // key가 바뀌면 새 경계라 페이지 이동 때도 이전 목록 대신 "불러오는 중"을 보여준다(검색과 같음)
    <Suspense key={page} fallback={<p className="mt-10 text-center text-ink-muted">불러오는 중…</p>}>
      <NewsPageList page={page} />
    </Suspense>
  );
}

async function NewsPageList({ page }: { page: number }) {
  const res = await getNews(page, PAGE_SIZE);
  if ("error" in res) return <p role="alert" className="mt-10 text-center text-ink-muted">{res.error.message}</p>;
  const { totalCount, items } = res.data;
  const lastPage = Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, MAX_PAGE);

  if (items.length === 0) {
    return (
      <p className="mt-10 text-center text-ink-muted">
        {totalCount === 0 ? (
          "아직 소식이 없어요."
        ) : (
          // 주소창에 큰 page를 넣은 경우
          <Link href="/news" className="font-bold text-brand-700">
            첫 페이지로
          </Link>
        )}
      </p>
    );
  }

  return (
    <>
      <Timeline items={items} />
      <Pagination page={page} lastPage={lastPage} href={(p) => (p > 0 ? `/news?page=${p}` : "/news")} />
    </>
  );
}

// 월별 타임라인(2026-11-21 시안 A-2). 달 머리글 아래 세로선 + 카드, 사유는 카드 아래 코랄 띠.
// 머리글에 건수를 쓰지 않는다. 한 달이 두 페이지에 걸치면 이 페이지에 보이는 수만 세게 된다
function Timeline({ items }: { items: NewsItem[] }) {
  // 백엔드가 등록일 최신순(날짜 없음은 맨 뒤)으로 주므로 순서대로 묶기만 한다
  const groups: { key: string; items: NewsItem[] }[] = [];
  for (const n of items) {
    const key = n.date?.slice(0, 7) ?? "";
    if (groups.at(-1)?.key !== key) groups.push({ key, items: [] });
    groups.at(-1)!.items.push(n);
  }

  return (
    <div className="mt-2">
      {groups.map((g) => (
        <section key={g.key} className="mt-8">
          <h2 className="text-lg font-extrabold text-ink">{g.key ? `${g.key.slice(0, 4)}년 ${Number(g.key.slice(5))}월` : "날짜 없음"}</h2>
          <ol className="mt-3 ml-1.5 flex flex-col gap-3 border-l-2 border-line pl-7">
            {g.items.map((n) => (
              <TimelineCard key={`${n.type}-${n.id}`} n={n} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function TimelineCard({ n }: { n: NewsItem }) {
  const tag = TAGS[n.type] ?? UNKNOWN_TAG;
  return (
    <li className="relative">
      {/* 세로선 위의 점. 카드 바깥(왼쪽)에 그려서, 코랄 띠 모서리를 자르는 overflow-hidden은 안쪽 상자에만 둔다 */}
      <span aria-hidden="true" className="absolute top-[22px] -left-[37px] size-3 rounded-full border-[3px] border-white bg-recall-fill ring-1 ring-recall-border" />
      <div className="overflow-hidden rounded-tile border border-line bg-white shadow-card">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${tag.tone}`}>{tag.label}</span>
            {n.grade && <GradeBadge grade={n.grade} />}
            {n.date && <span className="ml-auto text-sm tabular-nums text-ink-muted">{Number(n.date.slice(8))}일</span>}
          </div>
          <p className="mt-2 font-bold break-keep text-ink">{n.title}</p>
          {n.manufacturer && <p className="mt-0.5 text-xs text-ink-muted">제조사 {n.manufacturer}</p>}
        </div>
        {n.reason && (
          <p className="flex items-start gap-2 border-t border-recall-border bg-recall-bg px-5 py-2.5 text-sm text-recall-fg">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-3.5 shrink-0">
              <path d="M12 3 2 20h20zM12 10v4M12 17h.01" />
            </svg>
            <span>
              회수 사유 <b className="font-bold break-keep text-ink">{n.reason}</b>
            </span>
          </p>
        )}
      </div>
    </li>
  );
}

// 1·2등급은 진한 코랄(위해도가 높음), 그 밖(3등급·자율회수 등 원문)은 노랑
function GradeBadge({ grade }: { grade: string }) {
  const severe = grade.startsWith("1") || grade.startsWith("2");
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${severe ? "bg-recall-fg text-white" : "bg-warn-bg text-warn-fg"}`}>{grade}</span>
  );
}
