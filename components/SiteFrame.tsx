import Link from "next/link";

import { Suspense } from "react";
import { MainNav, NavLinks } from "./MainNav";

// 초안 1번 헤더: 로고 · 메뉴 │ 검색(MainNav가 함께 그림). 로그인 버튼은 로그인(백엔드 3단계) 뒤에 오른쪽 검색 옆에 붙인다
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink hover:text-ink">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-[10px] bg-brand-100 text-brand-700">
            {/* 알약 아이콘 */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-[18px]">
              <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
              <path d="m9.2 9.2 5.6 5.6" />
            </svg>
          </span>
          알꾼이
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <MainNav />
        </Suspense>
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
