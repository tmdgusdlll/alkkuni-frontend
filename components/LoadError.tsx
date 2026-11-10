"use client"; // error.tsx에서 쓰고 retry를 버튼에 건다

// 백엔드가 꺼져 있거나 5xx일 때(lib/api.ts가 던진 예외) 각 화면의 error.tsx가 이걸 그린다
export function LoadError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-24 text-center">
      <p className="text-lg font-bold text-ink">{title}</p>
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
