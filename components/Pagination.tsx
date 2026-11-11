import Link from "next/link";

// 이전·다음 페이지 링크. page·lastPage는 0부터. 페이지가 하나뿐이거나 범위 밖이면 그리지 않는다
export function Pagination({ page, lastPage, href }: { page: number; lastPage: number; href: (page: number) => string }) {
  if (lastPage <= 0 || page > lastPage) return null;
  return (
    <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-4 text-sm">
      {page > 0 ? (
        <Link href={href(page - 1)} className="font-bold">
          ← 이전
        </Link>
      ) : (
        <span className="text-ink-muted">← 이전</span>
      )}
      <span className="tabular-nums text-ink-muted">
        {page + 1} / {lastPage + 1}
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} className="font-bold">
          다음 →
        </Link>
      ) : (
        <span className="text-ink-muted">다음 →</span>
      )}
    </nav>
  );
}
