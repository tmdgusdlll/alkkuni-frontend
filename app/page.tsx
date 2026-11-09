import { SearchBar } from "@/components/SearchBar";

// 메인은 검색 히어로만 둔다. 인기 성분 비교 등 나머지는 메인 작업 때(docs/PROGRESS.md)
export default function Home() {
  return (
    <main className="bg-brand-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-24 text-center">
        <h1 className="text-[40px] font-extrabold tracking-tight text-ink">어떤 영양제가 궁금하세요?</h1>
        <p className="mt-3 text-ink-muted">식약처 공공데이터로 성분과 함량을 한눈에 비교해 드려요</p>
        <div className="mt-8 w-full max-w-[660px]">
          <SearchBar size="hero" />
        </div>
      </div>
    </main>
  );
}
