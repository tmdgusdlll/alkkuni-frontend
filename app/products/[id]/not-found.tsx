import Link from "next/link";

// 없는 제품 id(백엔드 PRODUCT_NOT_FOUND)나 숫자가 아닌 id
export default function ProductNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-24 text-center">
      <p className="text-lg font-bold text-ink">제품을 찾을 수 없어요.</p>
      <p className="mt-2 text-ink-muted">신고가 취소됐거나 주소가 잘못됐을 수 있어요.</p>
      <Link href="/search" className="mt-6 inline-block rounded-full border border-brand-500 px-5 py-2 font-bold text-brand-700">
        제품 검색하기
      </Link>
    </main>
  );
}
