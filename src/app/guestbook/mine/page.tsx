import MyBouquet from "@/components/MyBouquet";

import { village } from "@/lib/village";

export const metadata = { title: `내 꽃다발 | ${village.meta.siteName}` };

export default function Page() {
  return <MyBouquet />;
}
