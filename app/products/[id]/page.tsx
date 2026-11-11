import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { BasisBadge, OtherUnitBadge, ReviewBadge } from "@/components/badges";
import { DvProgress } from "@/components/DvProgress";
import { FormIcon } from "@/components/FormIcon";
import { api } from "@/lib/api";
import { formatAmount, formatDate } from "@/lib/format";
import type { DetailIngredient, DetailRecall, ProductDetailResponse } from "@/types/api";

// 탭 제목과 본문이 같은 요청 안에서 한 번만 부르게 묶는다(api()가 timeout signal을 넘겨 fetch 자동 중복 제거를 믿지 않음).
// 숫자가 아니거나 백엔드 Long(19자리)을 넘는 id는 백엔드가 400을 주지만 사용자에게는 없는 제품과 같아 부르지 않는다
const getProduct = cache(async (id: string) =>
  /^\d{1,18}$/.test(id) ? api<ProductDetailResponse>(`/api/products/${id}`) : null,
);

export async function generateMetadata(props: PageProps<"/products/[id]">): Promise<Metadata> {
  const res = await getProduct((await props.params).id);
  // 에러면 기본 제목(layout의 "알꾼이")을 그대로 둔다. 화면은 본문이 처리한다
  return res && "data" in res ? { title: `${res.data.name} - 알꾼이` } : {};
}

// DESIGN.md 8.4. params는 요청 때만 알 수 있어 Suspense 안에서 읽는다(cacheComponents). 바깥 틀은 미리 만들어진다
export default function ProductPage(props: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
      <Suspense fallback={<p className="text-ink-muted">불러오는 중…</p>}>
        <ProductContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[id]">["params"] }) {
  const res = await getProduct((await params).id);
  if (!res) notFound();
  if ("error" in res) {
    if (res.error.code === "PRODUCT_NOT_FOUND") notFound();
    // 그 밖의 4xx는 백엔드 문구를 그대로(ErrorCode.message는 사용자에게 보여도 되는 문장만 쓴다). 5xx는 api()가 던져 error.tsx로
    return (
      <p role="alert" className="mt-10 text-center text-ink-muted">
        {res.error.details?.[0]?.reason ?? res.error.message}
      </p>
    );
  }
  const p = res.data;
  const needsReview = p.parseStatus === "NEEDS_REVIEW";

  return (
    <>
      <nav aria-label="현재 위치" className="text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink">
          홈
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">제품 상세</span>
      </nav>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[360px_1fr]">
        {/* 왼쪽: 제품 요약 */}
        <section className="lg:sticky lg:top-8">
          <div className="relative flex aspect-[4/3] items-center justify-center rounded-hero bg-brand-50">
            <FormIcon form={p.form} size={160} />
            <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs text-ink-muted">
              이미지 준비 중
            </span>
          </div>
          {p.manufacturer && <p className="mt-5 text-sm text-ink-muted">{p.manufacturer}</p>}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight break-keep text-ink">{p.name}</h1>
          {(p.recalls.length > 0 || needsReview) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.recalls.length > 0 && (
                <a
                  href="#recalls"
                  className="inline-flex items-center gap-1 rounded-full bg-recall-bg px-2.5 py-1 text-xs font-bold text-recall-fg"
                >
                  회수 이력 있음
                </a>
              )}
              {needsReview && <ReviewBadge />}
            </div>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-2">
            <InfoTile label="제형" value={p.form} />
            <InfoTile label="신고일" value={p.reportedOn && formatDate(p.reportedOn)} />
            <InfoTile label="섭취 방법" value={p.intakeMethod} wide />
            <InfoTile label="신고번호" value={p.reportNo} wide />
          </dl>
        </section>

        {/* 오른쪽: 성분표 → 기능성 → 주의사항 → 회수 이력 */}
        <div className="flex min-w-0 flex-col gap-6">
          <IngredientTable ingredients={p.ingredients} basisCheck={p.basisCheck} needsReview={needsReview} />
          {p.functionality && (
            <section className="rounded-panel bg-surface p-6">
              <h2 className="text-lg font-extrabold text-ink">식약처 인정 기능성</h2>
              <p className="mt-1 text-sm text-ink-muted">제품에 표시된 기능성 문구를 그대로 옮겼어요.</p>
              {/* 원문의 줄바꿈·번호를 그대로 둔다(성분별 구조가 제품마다 달라 나누지 않음) */}
              <p className="mt-4 whitespace-pre-line rounded-card bg-white p-4 text-[15px] leading-relaxed text-ink-soft">
                {p.functionality}
              </p>
            </section>
          )}
          {p.precautions && (
            <section className="rounded-panel bg-warn-surface p-6">
              <h2 className="text-lg font-extrabold text-warn-fg">섭취 시 주의사항</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{p.precautions}</p>
            </section>
          )}
          {p.recalls.length > 0 && <Recalls recalls={p.recalls} />}
        </div>
      </div>
    </>
  );
}

function InfoTile({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={`rounded-tile bg-surface px-4 py-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-1 font-bold break-keep text-ink">{value}</dd>
    </div>
  );
}

function IngredientTable({
  ingredients,
  basisCheck,
  needsReview,
}: {
  ingredients: DetailIngredient[];
  basisCheck: ProductDetailResponse["basisCheck"];
  needsReview: boolean;
}) {
  return (
    <section className="rounded-panel border border-line bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-ink">성분표</h2>
        <BasisBadge basisCheck={basisCheck} />
      </div>
      {needsReview && (
        <p className="mt-3 rounded-tile bg-warn-surface px-4 py-3 text-sm text-warn-fg">
          함량 값이 이상해 검수를 기다리고 있어요. 원문과 다를 수 있어요.
        </p>
      )}
      {ingredients.length === 0 ? (
        <p className="mt-6 text-ink-muted">성분 함량 정보가 없어요.</p>
      ) : (
        <>
          {/* 좁은 화면에서는 막대가 성분·함량 아래로 내려간다(가로 스크롤 없이) */}
          <div aria-hidden="true" className="mt-4 hidden grid-cols-[minmax(0,1fr)_auto_45%] gap-x-6 border-b border-line pb-2 text-xs text-ink-muted sm:grid">
            <span>성분</span>
            <span className="text-right">1일 함량</span>
            <span>1일 기준치 대비</span>
          </div>
          <ul className="mt-2 sm:mt-0">
            {/* 성분표 순서 그대로. 같은 성분 행이 여러 개여도 합치지 않는다(멀티팩 등) */}
            {ingredients.map((g, i) => (
              <IngredientRow key={i} g={g} />
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-xs text-ink-muted">
        100%를 넘으면 막대가 가득 차고 진하게 표시돼요.
        {ingredients.some((g) => g.dailyAmount === null) && " 1일 함량을 계산하지 못한 성분은 성분표 원문 값(기준량당)을 그대로 보여줘요."}
      </p>
    </section>
  );
}

function IngredientRow({ g }: { g: DetailIngredient }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-line-soft py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_45%]">
      <p className="font-bold break-keep text-ink">
        {g.name}
        {/* 오류 의심 값(상한 2배 초과)은 판정하지 않고 경고만(DESIGN.md 7.3.1) */}
        {g.exceedsUpperLimit && (
          <span className="ml-2 align-middle">
            <ReviewBadge />
          </span>
        )}
      </p>
      <p className="text-right whitespace-nowrap">
        {g.dailyAmount === null ? (
          // 1일 함량을 계산하지 못한 행은 성분표 원문 값만(DESIGN.md 7.3.1)
          <span className="text-sm text-ink-soft">
            {formatAmount(g.amount)}
            {g.unit} / {formatAmount(g.basisAmount)}
            {g.basisUnit}
          </span>
        ) : (
          <b className="text-lg font-extrabold tabular-nums text-ink">
            {formatAmount(g.dailyAmount)}
            <small className="ml-0.5 text-xs font-medium text-ink-muted">{g.dailyUnit}</small>
          </b>
        )}
      </p>
      <div className="col-span-2 empty:hidden sm:col-span-1">
        <ReferenceCell g={g} />
      </div>
    </li>
  );
}

// 기준치 대비 칸(DESIGN.md 7.2, 7.3.1). 판정은 백엔드 값만 쓴다
function ReferenceCell({ g }: { g: DetailIngredient }) {
  // 오류 의심 값은 판정하지 않는다. 막대·%(예: 25,000%)를 그리면 초과 섭취를 단정하는 모양이 돼 "검수 대기"만 남긴다
  if (g.exceedsUpperLimit) return null;
  // 1일 함량을 모르는 행은 원문 값만(함량 칸에 있음)
  if (g.dailyAmount === null) return null;
  // 기준값은 있는데 %가 없으면 단위가 달라 비교하지 못한 것(엽산 DFE·mg 등)
  if (g.referencePercent === null && g.referenceAmount !== null) return <OtherUnitBadge />;
  return <DvProgress percent={g.referencePercent} hasReference={g.referenceAmount !== null} />;
}

// DESIGN.md 7.4: 회수일·공지 링크는 API에 없어 자리를 두지 않는다
function Recalls({ recalls }: { recalls: DetailRecall[] }) {
  return (
    <section id="recalls" className="rounded-panel border border-recall-border bg-recall-bg p-6">
      <h2 className="text-lg font-extrabold text-recall-fg">회수 이력 {recalls.length}건</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {recalls.map((r, i) => (
          <li key={i} className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-tile bg-white px-4 py-3">
              <p className="text-xs text-ink-muted">사유</p>
              <p className="mt-1 font-bold text-ink">{r.reason ?? "사유 정보 없음"}</p>
            </div>
            <div className="rounded-tile bg-white px-4 py-3">
              <p className="text-xs text-ink-muted">대상 소비기한</p>
              <p className="mt-1 font-bold text-ink">{r.expiryText ?? "정보 없음"}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-recall-fg">위 소비기한이 적힌 제품만 해당돼요.</p>
    </section>
  );
}
