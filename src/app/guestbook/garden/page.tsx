import AllGarden from "@/components/AllGarden";

import { village } from "@/lib/village";

export const metadata = { title: `모두의 정원 | ${village.meta.siteName}` };

export default function Page() {
  return <AllGarden />;
}
