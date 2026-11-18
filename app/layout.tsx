import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter, SiteHeader } from "@/components/SiteFrame";
import "./globals.css";

// globals.css의 --font-sans가 이 변수를 먼저 쓴다
const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "알꾼이",
  description: "식약처 공공데이터로 영양제 성분과 함량을 비교해요",
  // 로그인이 완성될 때까지 검색 색인 금지(모든 페이지가 물려받음). 여는 방법은 docs/PROGRESS.md "검색 엔진 공개"
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
