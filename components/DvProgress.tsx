// DESIGN.md 7.2: 1일 기준값 대비 %(referencePercent)를 둥근 진행 바로. 판정·계산은 백엔드 값을 그대로 쓴다
export function DvProgress({ percent, hasReference }: { percent: number | null; hasReference: boolean }) {
  if (percent === null) {
    // 기준값이 없는 성분만 알리고, 단위를 비교할 수 없는 경우는 비워 둔다
    return hasReference ? null : <span className="text-xs text-ink-muted">기준치 없음</span>;
  }
  // 기준치와 같은 100%는 "넘음"이 아니다(DESIGN.md 7.2 "100%를 넘으면")
  const over = percent > 100;
  return (
    <div className="flex items-center gap-3">
      <div
        role="img"
        aria-label={`1일 기준치 대비 ${percent}%`}
        className="h-2.5 min-w-16 flex-1 overflow-hidden rounded-full bg-track"
      >
        {/* 100%를 넘으면 가득 채우고 진하게. 아주 작은 값도 보이게 최소 4% */}
        <div
          className={`h-full rounded-full ${over ? "bg-brand-700" : "bg-brand-500"}`}
          style={{ width: `${Math.max(Math.min(percent, 100), 4)}%` }}
        />
      </div>
      {/* 최소 폭만 두고 늘어나게 한다(고함량은 "5,000%"처럼 길다) */}
      <span className="min-w-12 shrink-0 text-right text-sm font-bold tabular-nums text-ink-soft" aria-hidden="true">
        {percent.toLocaleString("ko-KR")}%
      </span>
    </div>
  );
}
