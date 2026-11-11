// 함량 숫자. 백엔드가 μg을 mg으로 바꿔 주므로(0.4μg → 0.0004) 기본값(소수 3자리)이면 0으로 뭉개진다
export function formatAmount(n: number) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
}

// "2024-03-05" → "2024.03.05"
export function formatDate(iso: string) {
  return iso.replaceAll("-", ".");
}

// 제품 부가정보 한 줄: "제조사 OO · 정 · 2026.10.23 신고". 제조사는 위탁생산 회사라 브랜드처럼 보이지 않게 "제조사"를 붙인다(DESIGN.md 9)
export function productMeta(p: { manufacturer: string | null; form: string | null; reportedOn?: string | null }) {
  return [p.manufacturer && `제조사 ${p.manufacturer}`, p.form, p.reportedOn && `${formatDate(p.reportedOn)} 신고`]
    .filter(Boolean)
    .join(" · ");
}
