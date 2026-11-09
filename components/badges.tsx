import type { BasisCheck } from "@/types/api";

// DESIGN.md 7.3: DAILY·PER_SERVING은 하루치를 확인한 값이라 "1일 기준", 그 외·null은 "표시 기준량"
export function BasisBadge({ basisCheck }: { basisCheck: BasisCheck | null }) {
  const daily = basisCheck === "DAILY" || basisCheck === "PER_SERVING";
  return daily ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-1 text-xs font-bold text-ok-fg">
      <CheckIcon />
      1일 기준
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-neutral-bg px-2.5 py-1 text-xs font-bold text-neutral-fg"
      title="제품 성분표에 적힌 기준량당 함량이에요. 하루 섭취량과 같은지 확인하지 못했어요."
    >
      표시 기준량
      <HelpIcon />
    </span>
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
