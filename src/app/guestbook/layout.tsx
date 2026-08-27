import type { Metadata } from "next";
import "./guestbook.css";

export const metadata: Metadata = {
  title: "꽃 우체국 | 코딩빌리지",
  description: "전시에 와 주신 분이 학생 한 명을 골라 꽃 한 송이와 한 마디를 놓고 가는 방명록입니다.",
};

export default function GuestbookLayout({ children }: { children: React.ReactNode }) {
  return <div className="gb">{children}</div>;
}
