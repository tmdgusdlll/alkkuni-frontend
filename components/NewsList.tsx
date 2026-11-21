import { formatDate } from "@/lib/format";
import type { NewsItem } from "@/types/api";

// 소식 한 줄: 종류 태그 · 제목·제조사 · 사유 · 날짜·등급(초안 1번). 메인 4건과 /news가 같이 쓴다.
// 회수는 제품 id가 아니라 신고번호로 이어져 있어(같은 이름의 다른 제품일 수 있음) 제품 상세로 링크하지 않는다
export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-white px-5 shadow-card">
      {items.map((n) => (
        <li key={`${n.type}-${n.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-4">
          <span className="shrink-0 rounded-md bg-recall-bg px-2 py-0.5 text-xs font-bold text-recall-fg">회수</span>
          {/* 제조사 이름에 "(주)"가 많아 괄호로 붙이지 않고 아래 줄에 둔다. "제조사"를 붙이는 건 DESIGN.md 9 */}
          <div className="min-w-0 flex-[1_1_200px]">
            <p className="font-bold break-keep text-ink">{n.title}</p>
            {n.manufacturer && <p className="mt-0.5 text-xs text-ink-muted">제조사 {n.manufacturer}</p>}
          </div>
          {n.reason && (
            <span className="max-w-full rounded-md bg-surface px-2 py-0.5 text-xs text-ink-soft">사유 · {n.reason}</span>
          )}
          <span className="shrink-0 text-xs tabular-nums text-ink-muted">
            {[n.date && formatDate(n.date), n.grade, "식약처"].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}
