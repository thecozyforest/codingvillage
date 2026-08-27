import type { Metadata, Viewport } from "next";
import "./globals.css";
import { village } from "@/lib/village";

// 커스텀 도메인을 붙이면 이 주소만 바꾸면 됩니다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codingvillage.vercel.app";

const { siteName, seoTitle, description, keywords } = village.meta;

/** 값이 비어 있으면 태그를 아예 붙이지 않습니다. */
const verification = () => {
  const { google, naver } = village.meta.verification;
  const out: Metadata["verification"] = {};
  if (google) out.google = google;
  if (naver) out.other = { "naver-site-verification": naver };
  return Object.keys(out).length > 0 ? out : undefined;
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: seoTitle,
  description,
  keywords,
  applicationName: siteName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName,
    title: seoTitle,
    description,
    url: siteUrl,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: seoTitle, description },
  verification: verification(),
};

export const viewport: Viewport = {
  themeColor: "#dff1e8",
  width: "device-width",
  initialScale: 1,
  // 전시장에서 아이들이 확대해서 볼 수 있어야 하므로 확대를 막지 않습니다.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 간판·손글씨용 글꼴. 못 받아와도 시스템 글꼴로 그대로 읽힙니다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
