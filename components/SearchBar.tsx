// 서버 컴포넌트. 폼 제출이 /search?q=로 이동만 하므로 클라이언트 코드가 필요 없다
export function SearchBar({ defaultValue, size = "compact" }: { defaultValue?: string; size?: "hero" | "compact" }) {
  const hero = size === "hero";
  return (
    <form
      action="/search"
      role="search"
      className={`flex w-full items-center gap-2 rounded-full bg-white pl-5 pr-1.5 ${
        hero ? "h-[68px] border-2 border-brand-500 shadow-search" : "h-12 border border-line"
      }`}
    >
      <label htmlFor={`q-${size}`} className="sr-only">
        검색어
      </label>
      <input
        id={`q-${size}`}
        name="q"
        type="search"
        defaultValue={defaultValue}
        required
        maxLength={100}
        placeholder="제품명이나 성분을 검색해 보세요 (예: 비타민C, 아연)"
        className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-muted ${hero ? "text-lg" : "text-[15px]"}`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-full bg-brand-700 font-bold text-white hover:bg-brand-800 ${
          hero ? "h-[52px] px-7" : "h-9 px-5 text-sm"
        }`}
      >
        검색
      </button>
    </form>
  );
}
