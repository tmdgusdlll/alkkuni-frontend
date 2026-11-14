"use client";

import { useEffect, useRef, useState } from "react";

// 가로로 넘기는 목록. 머리 줄 오른쪽 끝에 < > 화살표를 두고, 누르면 보이는 폭만큼(넓은 화면 3개) 넘긴다.
// 목록은 서버에서 그려 children으로 받는다(스트리밍으로 늦게 와도 화살표 상태가 따라가게 내용 변화를 지켜본다).
// 손가락·트랙패드로 밀어도 넘어가고, 카드 경계에 멈춘다(scroll-snap)
export function Carousel({
  label,
  heading,
  children,
}: {
  // 화살표 버튼 이름에 붙는 말("인기 성분 이전")
  label: string;
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // 소수 픽셀 오차로 끝에 닿아도 1px 남는 경우가 있어 여유를 둔다
    // 값이 그대로면 이전 객체를 돌려줘 스크롤 프레임마다 다시 그리지 않는다
    const update = () => {
      const start = el.scrollLeft <= 1;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    // 부드럽게 넘길지는 CSS(motion-safe:scroll-smooth)가 정한다
    el.scrollBy({ left: dir * el.clientWidth });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>{heading}</div>
        {/* 넘길 것이 없으면(카드가 한 화면에 다 들어감) 화살표를 숨긴다. 자리는 남겨 둬 하이드레이션 뒤 나타날 때 아래 카드가 밀리지 않게 한다 */}
        <div className={`flex gap-1.5 ${edge.start && edge.end ? "invisible" : ""}`}>
          <ArrowButton label={`${label} 이전`} disabled={edge.start} onClick={() => move(-1)} dir="prev" />
          <ArrowButton label={`${label} 다음`} disabled={edge.end} onClick={() => move(1)} dir="next" />
        </div>
      </div>
      {/* 카드 그림자가 잘리지 않게 안쪽 여백을 두고 같은 만큼 바깥으로 당긴다. 스크롤바는 화살표가 대신해 숨긴다 */}
      <div
        ref={track}
        className="-mx-2 mt-4 snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth scroll-px-2 px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </>
  );
}

function ArrowButton({ label, disabled, onClick, dir }: { label: string; disabled: boolean; onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
