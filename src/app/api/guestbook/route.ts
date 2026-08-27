import { NextRequest, NextResponse } from "next/server";
import { getBouquet, getConfig, getGarden, getRoster, isDemo, plantFlower } from "@/lib/gas";

export const dynamic = "force-dynamic";

const no = (msg: string, code = 400) => NextResponse.json({ ok: false, error: msg }, { status: code });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const action = sp.get("action") ?? "";

  if (action === "config") return NextResponse.json({ ...(await getConfig()), demo: isDemo });
  if (action === "roster") return NextResponse.json({ ...(await getRoster()), demo: isDemo });
  if (action === "garden") return NextResponse.json({ ...(await getGarden()), demo: isDemo });
  if (action === "bouquet") {
    const id = sp.get("studentId") ?? "";
    if (!id) return no("studentId 필요");
    return NextResponse.json({ ...(await getBouquet(id, sp.get("pin") ?? "")), demo: isDemo });
  }
  return no("unknown action: " + action);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return no("본문을 읽지 못했어요.");
  }

  const toId = String(body.toId ?? "").trim();
  const message = String(body.message ?? "").trim();
  const fromName = String(body.fromName ?? "").trim().slice(0, 20);
  const flower = String(body.flower ?? "daisy").trim().slice(0, 20);

  if (!toId) return no("꽃을 놓을 친구를 골라 주세요.");
  if (!message) return no("한 마디를 적어 주세요.");
  if (message.length > 200) return no("한 마디는 200자까지예요.");

  return NextResponse.json({ ...(await plantFlower({ toId, fromName, flower, message })), demo: isDemo });
}
