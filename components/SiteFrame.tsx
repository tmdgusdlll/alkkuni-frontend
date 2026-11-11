import Link from "next/link";

// 로그인·서랍·AI 메뉴는 MVP 범위 밖이라 아직 두지 않는다(DESIGN.md "MVP 범위")
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-ink hover:text-ink">
          알꾼이
        </Link>
        {/* ponytail: 활성 메뉴 표시(aria-current)는 현재 경로가 필요해 클라이언트 컴포넌트가 된다. 메뉴가 늘면 붙인다 */}
        <nav aria-label="주 메뉴">
          <Link href="/explore" className="text-[15px] font-bold text-ink-soft hover:text-brand-700">
            성분 비교
          </Link>
        </nav>
      </div>
    </header>
  );
}

// 출처 표시는 공공데이터 이용 조건이라 모든 화면에 둔다. 데이터 기준일은 내려주는 API가 생기면 붙인다
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-surface-gray">
      <div className="mx-auto max-w-[1200px] px-6 py-8 text-sm text-ink-muted">
        <p className="font-bold text-ink">알꾼이</p>
        <p className="mt-2">데이터 출처: 식품의약품안전처 식품안전나라</p>
        <p>알꾼이는 의학적 진단이나 처방을 대신하지 않아요.</p>
      </div>
    </footer>
  );
}
