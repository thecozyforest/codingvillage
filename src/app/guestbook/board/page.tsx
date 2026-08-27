import AllGarden from "@/components/AllGarden";

import { village } from "@/lib/village";

export const metadata = { title: `모두의 정원 | ${village.meta.siteName}` };

/** 전시장 태블릿에 띄우는 큰 화면입니다. */
export default function Page() {
  return <AllGarden board />;
}
