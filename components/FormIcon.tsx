// 제품 이미지가 없어 제형(I0030 PRDT_SHAP_CD_NM)으로 그린 아이콘을 둔다(DESIGN.md 5, PLANNING.md "제품 이미지").
// 흰 면 + 하늘색 선 + 노랑 포인트. 장식이라 화면 읽기 프로그램에서 숨긴다(제형은 글자로 옆에 있다)
type Kind = "tablet" | "capsule" | "powder" | "liquid" | "jelly" | "pill" | "bar";

const KIND: Record<string, Kind> = {
  정: "tablet",
  편상: "tablet",
  캡슐: "capsule",
  분말: "powder",
  과립: "powder",
  액상: "liquid",
  시럽: "liquid",
  젤리: "jelly",
  겔: "jelly",
  페이스트상: "jelly",
  환: "pill",
  바: "bar",
};

const STROKE = "var(--color-brand-500)";
const ACCENT = "#FFE08A";

const SHAPES: Record<Kind, React.ReactNode> = {
  // 타원 정제
  tablet: (
    <>
      <ellipse cx="24" cy="24" rx="14" ry="9" fill="white" />
      <path d="M13 24h22" />
    </>
  ),
  // 반반 캡슐
  capsule: (
    <g transform="rotate(-35 24 24)">
      <path d="M24 16h-6a8 8 0 0 0 0 16h6z" fill="white" />
      <path d="M24 16h6a8 8 0 0 1 0 16h-6z" fill={ACCENT} />
    </g>
  ),
  // 스틱 포
  powder: (
    <>
      <rect x="17" y="10" width="14" height="28" rx="3" fill="white" />
      <path d="M17 15h14" />
      <circle cx="24" cy="26" r="2.5" fill={ACCENT} stroke="none" />
    </>
  ),
  // 병
  liquid: (
    <>
      <path d="M21 10h6v5l4 4v17a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V19l4-4z" fill="white" />
      <path d="M17 27h14v9a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2z" fill={ACCENT} />
    </>
  ),
  // 젤리 큐브
  jelly: (
    <>
      <rect x="14" y="16" width="20" height="18" rx="6" fill={ACCENT} />
      <path d="M19 21h4" />
    </>
  ),
  // 작은 환 여러 알
  pill: (
    <>
      <circle cx="18" cy="27" r="5" fill="white" />
      <circle cx="29" cy="28" r="5" fill={ACCENT} />
      <circle cx="24" cy="18" r="5" fill="white" />
    </>
  ),
  bar: (
    <>
      <rect x="11" y="18" width="26" height="12" rx="3" fill="white" />
      <path d="M19 18v12M29 18v12" />
    </>
  ),
};

export function FormIcon({ form, size = 56 }: { form: string | null; size?: number }) {
  // 기타·모름은 가장 흔한 정제 모양
  const kind = (form && KIND[form]) || "tablet";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-tile bg-brand-50"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={size * 0.8}
        height={size * 0.8}
        viewBox="0 0 48 48"
        fill="none"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SHAPES[kind]}
      </svg>
    </span>
  );
}
