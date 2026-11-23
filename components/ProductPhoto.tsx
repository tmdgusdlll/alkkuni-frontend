"use client";

import { useState, type ReactNode } from "react";

// 외부 사진(쿠팡 등). 주소가 죽거나 막혀 못 불러오면 fallback(제형 아이콘)으로 바꾼다.
// 쿠팡 CDN이 다른 사이트의 Referer를 막을 수 있어 Referer를 보내지 않는다
export function ProductPhoto({ src, size, fallback }: { src: string; size: number; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    // 외부 주소라 next/image 허용 목록을 두지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-tile bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
}
