import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewsList } from "@/components/NewsList";
import { Pagination } from "@/components/Pagination";
import { getNews } from "@/lib/queries";

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
      <div className="mt-6">
        <NewsList items={items} />
      </div>
      <Pagination page={page} lastPage={lastPage} href={(p) => (p > 0 ? `/news?page=${p}` : "/news")} />
    </>
  );
}
