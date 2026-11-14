"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// AI 도우미·내 서랍은 MVP 범위 밖이라 아직 두지 않는다(DESIGN.md "MVP 범위")
const MENUS = [
  { href: "/", label: "홈" },
  { href: "/explore", label: "성분 비교" },
];

// 현재 경로가 필요해 클라이언트 컴포넌트다. 활성 메뉴는 brand-50 알약(DESIGN.md 6.3).
// 동적 경로(상세 등)에서는 경로가 요청 때 정해져 Suspense 안에서 써야 한다(SiteHeader가 감쌈)
export function MainNav() {
  return <NavLinks pathname={usePathname()} />;
}

// pathname이 null이면 활성 표시 없이(Suspense 대체 화면)
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <>
      <nav aria-label="주 메뉴" className="flex items-center gap-1">
        {MENUS.map((m) => {
          const active = m.href === "/" ? pathname === "/" : !!pathname?.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-[15px] ${
                active ? "bg-brand-50 font-bold text-brand-700" : "text-ink-soft hover:text-brand-700"
              }`}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
      {/* 검색 화면에서는 링크 대신 활성 표시만 둔다(같은 화면으로 가면 보던 검색어가 사라진다) */}
      {pathname === "/search" ? (
        <span role="img" aria-label="검색 (지금 화면)" className={`${SEARCH_ICON} bg-brand-50 text-brand-700`}>
          <SearchIcon />
        </span>
      ) : (
        // 검색 화면은 검색어가 없으면 검색창만 보여준다
        <Link href="/search" aria-label="검색" className={`${SEARCH_ICON} text-ink-soft hover:bg-surface hover:text-brand-700`}>
          <SearchIcon />
        </Link>
      )}
    </>
  );
}

const SEARCH_ICON = "ml-auto grid size-10 shrink-0 place-items-center rounded-full";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
