import { AmountBar } from "@/components/AmountBar";
import { OtherUnitBadge, ReviewBadge } from "@/components/badges";
import { formatAmount } from "@/lib/format";
import type { CompareAmount, IngredientItem } from "@/types/api";

// 함량 칸이 판정에 쓰는 성분 정보. 목록(explore)·비교(compare) 응답의 성분 행에 둘 다 있다
type UnitRule = Pick<IngredientItem, "defaultUnit" | "referenceAmount">;

// 한 성분의 함량 행들. 같은 성분 행이 여러 개(멀티팩 등)면 합치지 않고 "+"로 이어 모두 보여준다(DESIGN.md 7.3.1)
export function AmountCell({ values, ing, barMax }: { values: CompareAmount[]; ing: UnitRule; barMax: number | null }) {
  if (values.length === 0) return <span className="text-ink-muted">—</span>;
  return (
    <ul className="flex flex-col gap-2.5">
      {values.map((v, i) => {
        const bar = barMax === null ? null : barValue(v, ing);
        return (
          <li key={i}>
            {bar !== null && (
              <div className="mb-1.5 max-w-48">
                <AmountBar value={bar} max={barMax!} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {i > 0 && <span className="text-ink-muted">+</span>}
              {v.dailyAmount === null ? (
                // 1일 함량을 계산하지 못한 행은 성분표 원문 값만
                <span className="text-sm whitespace-nowrap text-ink-soft">
                  {formatAmount(v.amount)}
                  {v.unit} / {formatAmount(v.basisAmount)}
                  {v.basisUnit}
                </span>
              ) : (
                <b className="text-lg font-extrabold whitespace-nowrap tabular-nums text-ink">
                  {formatAmount(v.dailyAmount)}
                  <small className="ml-0.5 text-xs font-medium text-ink-muted">{v.dailyUnit}</small>
                </b>
              )}
              <AmountStatus v={v} ing={ing} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// 기준치 대비 칸(DESIGN.md 7.2, 7.3.1). 판정·%는 백엔드 값만 쓴다
function AmountStatus({ v, ing }: { v: CompareAmount; ing: UnitRule }) {
  // 오류 의심 값은 %(예: 948%)를 보이면 초과 섭취를 단정하는 모양이 돼 "검수 대기"만 둔다
  if (v.exceedsUpperLimit) return <ReviewBadge />;
  if (v.dailyAmount === null) return null;
  if (isOtherUnit(v, ing)) return <OtherUnitBadge />;
  if (v.referencePercent !== null) {
    return (
      <span className="text-sm font-bold whitespace-nowrap tabular-nums text-ink-soft">
        기준치 {v.referencePercent.toLocaleString("ko-KR")}%
      </span>
    );
  }
  // 기준값은 있는데 %가 없으면 단위를 비교하지 못한 것
  return ing.referenceAmount !== null ? <OtherUnitBadge /> : null;
}

// 막대로 견줄 값. 1일 함량을 모르거나, 오류 의심이거나, 주 단위가 아닌 값은 막대 없이 숫자만(DESIGN.md 7.1)
export function barValue(v: CompareAmount, ing: UnitRule) {
  if (v.dailyAmount === null || v.exceedsUpperLimit) return null;
  if (isOtherUnit(v, ing)) return null;
  return v.dailyAmount;
}

// 주 단위(defaultUnit)와 다르게 적힌 값(엽산 mg·DFE 등). 막대·기준치로 견주지 않는다(DESIGN.md 7.3.1)
function isOtherUnit(v: CompareAmount, ing: UnitRule) {
  return ing.defaultUnit !== null && v.dailyUnit !== ing.defaultUnit;
}
