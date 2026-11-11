"use client"; // 에러 경계는 클라이언트 컴포넌트여야 한다

import { LoadError } from "@/components/LoadError";

export default function ExploreError({ retry }: { error: unknown; retry: () => void }) {
  return <LoadError title="제품 목록을 불러오지 못했어요." retry={retry} />;
}
