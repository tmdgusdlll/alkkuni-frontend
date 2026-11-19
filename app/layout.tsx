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

// 도메인(kuromi.click)에 서비스 이름이 없어 검색 결과·공유 카드에 "알꾼이"가 늘 보이게 한다(docs/PROGRESS.md "검색 엔진 공개")
export const metadata: Metadata = {
  // og:image 등 상대 경로를 절대 URL로 만드는 기준. 로컬에서도 운영 주소로 나간다
  metadataBase: new URL("https://kuromi.click"),
  // 페이지가 title을 주면 "제품명 | 알꾼이", 안 주면 default
  title: { default: "알꾼이 - 영양제 성분·함량 비교", template: "%s | 알꾼이" },
  description: "식약처 공공데이터로 영양제 성분과 함량을 비교해요",
  // 공유 카드. 이미지는 app/opengraph-image.png를 Next가 자동으로 붙인다.
  // og:title·og:description은 적지 않는다. 비워 두면 Next가 페이지별 title·description으로 채운다.
  // 페이지에서 openGraph를 주지 않는다(얕게 합쳐져 여기 값과 og:image가 통째로 사라짐)
  openGraph: { siteName: "알꾼이", locale: "ko_KR", type: "website" },
  // 네이버 서치어드바이저 소유 확인(네이버는 DNS TXT 확인이 없어 메타 태그). 지우면 소유 확인이 풀린다.
  // Google Search Console은 Route 53 TXT로 확인해 여기 넣지 않는다
  verification: { other: { "naver-site-verification": "f3951daae70a7c14e126390cb56511670a6b49ca" } },
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
