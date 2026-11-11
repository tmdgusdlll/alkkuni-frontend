import type { BasisCheck } from "@/types/api";

// DESIGN.md 7.3: DAILY·PER_SERVING은 하루치를 확인한 값이라 "1일 기준", 그 외·null은 "표시 기준량".
// explain=false는 설명을 펼치지 않는다. 가로 스크롤 표 안에서는 펼친 설명이 잘려 옆 안내(범례)에 설명을 둔다
export function BasisBadge({ basisCheck, explain = true }: { basisCheck: BasisCheck | null; explain?: boolean }) {
  const daily = basisCheck === "DAILY" || basisCheck === "PER_SERVING";
  return daily ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-1 text-xs font-bold text-ok-fg">
      <CheckIcon />
      1일 기준
    </span>
  ) : !explain ? (
    <span className="inline-flex items-center rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-bold text-neutral-fg">
      표시 기준량
    </span>
  ) : (
    // title은 터치·키보드로 열 수 없어 details로 누르면 설명이 열리게 한다(DESIGN.md 7.3)
    <details className="relative inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-bold text-neutral-fg [&::-webkit-details-marker]:hidden">
        표시 기준량
        <HelpIcon />
      </summary>
      <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-tile border border-line bg-white p-3 text-xs text-ink-soft shadow-card">
        제품 성분표에 적힌 기준량당 함량이에요. 하루 섭취량과 같은지 확인하지 못했어요.
      </p>
    </details>
  );
}

// DESIGN.md 7.3.1: 상한을 크게 넘는 등 함량이 이상해 검수를 기다리는 제품
export function ReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-bold text-warn-fg">
      <AlertIcon />
      검수 대기
    </span>
  );
}

// DESIGN.md 7.3.1: 엽산 DFE·mg처럼 주 단위와 다르게 적혀 기준치·다른 제품과 비교하지 않는 값
export function OtherUnitBadge() {
  return (
    <span className="inline-flex rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-bold text-neutral-fg">
      다른 단위 표기
    </span>
  );
}

// 둥근 선 아이콘(DESIGN.md 5). 장식이라 화면 읽기 프로그램에서 숨긴다
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const CheckIcon = () => (
  <Icon>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

const HelpIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </Icon>
);

const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
);
