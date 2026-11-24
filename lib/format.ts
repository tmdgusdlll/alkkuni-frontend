// 함량 숫자. 백엔드가 μg을 mg으로 바꿔 주므로(0.4μg → 0.0004) 기본값(소수 3자리)이면 0으로 뭉개진다
export function formatAmount(n: number) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
}

// 백엔드는 1일 함량을 비교·정렬하려고 mg으로 준다(비타민 D 10μg → 0.01mg). 성분 표시 단위가 μg이면 질량 단위만 바꿔 보여준다.
// 환산 표기는 이어 붙인다("mg DFE" → "μg DFE"). CFU 같은 단위는 그대로다
export function isMicro(unit: string | null, displayUnit: string | null): unit is string {
  return displayUnit === "μg" && unit !== null && /^mg( |$)/u.test(unit);
}

// 1일 함량 표시 값과 단위. 원문 값(amount/basis)은 성분표 그대로라 쓰지 않는다
export function displayAmount(value: number, unit: string | null, displayUnit: string | null) {
  return { value: formatAmount(isMicro(unit, displayUnit) ? value * 1000 : value), unit: displayUnitOf(unit, displayUnit) };
}

export function displayUnitOf(unit: string | null, displayUnit: string | null) {
  return isMicro(unit, displayUnit) ? `μg${unit.slice(2)}` : unit;
}

// 표시 단위(μg)로 받은 함량 범위 → API 값(mg). 소수 계산으로 값이 바뀌지 않게 지수만 옮긴다("400" → "400e-3", 백엔드 BigDecimal이 그대로 읽음)
export function microToMg(s: string) {
  const [mantissa, exp = "0"] = s.split(/e/iu);
  return `${mantissa}e${Number(exp) - 3}`;
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

// 카드 위 브랜드·아래 이름으로 나눈다(백엔드 PLANNING.md "검색 결과 표시" 1). 이름 앞의 브랜드 표기는
// BrandName.nameKey와 같은 규칙(앞 괄호·공백·대소문자 무시)으로 떼고, 브랜드로 시작하지 않으면("ATOMY …") 이름을 그대로 둔다
export function splitBrandName(brand: string | null, name: string): { brand: string | null; name: string } {
  if (!brand) return { brand: null, name };
  const key = brand.replace(/\s+/gu, "").toUpperCase();
  let i = name.match(/^\s*[[(<【]?\s*/u)?.[0].length ?? 0;
  let k = 0;
  while (i < name.length && k < key.length) {
    if (/\s/u.test(name[i])) i++;
    else if (name[i].toUpperCase() === key[k]) {
      i++;
      k++;
    } else break;
  }
  if (k < key.length) return { brand, name };
  // "일양약품 아연365"(브랜드 "일양", 사전 별칭 "일양약품")처럼 회사명 꼬리도 브랜드 표기라 같이 뗀다
  // ponytail: 로컬 브랜드 제품 5,429개 중 띄어쓰기 없이 붙은 315개를 보고 정한 꼬리(2026-11-23). 사전 별칭이 늘면 다시 본다
  // 꼬리는 단어가 끝날 때만("일양 제약회사…"는 그대로), 닫는 괄호보다 먼저 지운다("[일양약품] 아연365")
  const rest = name
    .slice(i)
    .replace(/^(약품|제약)(?=[\s\])>】]|$)/u, "")
    .replace(/^\s*[\])>】]?\s*/u, "");
  // 이름이 브랜드뿐이면 뗄 게 없다
  return { brand, name: rest || name };
}
