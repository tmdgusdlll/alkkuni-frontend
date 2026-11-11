// DESIGN.md 7.1: 같은 성분·같은 단위 값끼리 비교하는 가로 막대. 너비 = value / max, 아주 작은 값도 보이게 최소 4%.
// 숫자는 옆에 항상 글자로 있어 막대는 장식이다
export function AmountBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 4) : 4;
  return (
    <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div className="h-full rounded-full bg-brand-500" style={{ width: `${width}%` }} />
    </div>
  );
}
