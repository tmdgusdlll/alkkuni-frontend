"use client"; // 에러 경계는 클라이언트 컴포넌트여야 한다

// 백엔드가 꺼져 있거나 응답을 읽지 못할 때(lib/api.ts가 던진 예외)
export default function ProductError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-24 text-center">
      <p className="text-lg font-bold text-ink">제품 정보를 불러오지 못했어요.</p>
      <p className="mt-2 text-ink-muted">잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={retry}
        className="mt-6 rounded-full border border-brand-500 px-5 py-2 font-bold text-brand-700"
      >
        다시 시도
      </button>
    </main>
  );
}
