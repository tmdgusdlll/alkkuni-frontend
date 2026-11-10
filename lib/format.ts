// 함량 숫자. 백엔드가 μg을 mg으로 바꿔 주므로(0.4μg → 0.0004) 기본값(소수 3자리)이면 0으로 뭉개진다
export function formatAmount(n: number) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
}

// "2024-03-05" → "2024.03.05"
export function formatDate(iso: string) {
  return iso.replaceAll("-", ".");
}
