/* ==========================================================
   GAS(구글 앱스 스크립트) 다리
   브라우저가 GAS를 직접 부르면 CORS에 걸리므로, 항상 이 서버를 거칩니다.
   GUESTBOOK_GAS_URL 이 없으면 「데모 모드」로 떨어져서
   시트를 만들기 전에도 화면을 눌러 볼 수 있습니다.
   ========================================================== */

import type { Entry, Student } from "./gardenTypes";
export type { Entry, Student };

const GAS_URL = process.env.GUESTBOOK_GAS_URL || "";
export const isDemo = !GAS_URL;

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

async function callGas<T>(
  init: { action: string; params?: Record<string, string>; body?: unknown }
): Promise<Ok<T> | Err> {
  try {
    if (init.body) {
      const res = await fetch(GAS_URL, {
        method: "POST",
        // GAS는 text/plain으로 보내야 본문이 그대로 e.postData.contents에 들어옵니다.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: init.action, ...(init.body as object) }),
        cache: "no-store",
      });
      return (await res.json()) as Ok<T> | Err;
    }
    const url = new URL(GAS_URL);
    url.searchParams.set("action", init.action);
    for (const [k, v] of Object.entries(init.params ?? {})) url.searchParams.set(k, v);
    const res = await fetch(url, { cache: "no-store" });
    return (await res.json()) as Ok<T> | Err;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "연결에 실패했어요." };
  }
}

/* ── 데모 저장소 ─────────────────────────────
   서버가 다시 뜨면 지워집니다. 전시에 쓰는 저장소가 아닙니다. */

const demoStudents: Omit<Student, "flowers">[] = [
  { id: "d1", name: "김하늘", group: "1모둠" },
  { id: "d2", name: "박서준", group: "1모둠" },
  { id: "d3", name: "이도윤", group: "2모둠" },
  { id: "d4", name: "최유나", group: "2모둠" },
  { id: "d5", name: "정민서", group: "3모둠" },
  { id: "d6", name: "한지우", group: "3모둠" },
];

const demoEntries: Entry[] = [];

function demoPlant(b: { toId: string; fromName: string; flower: string; message: string }) {
  const s = demoStudents.find((x) => x.id === b.toId);
  if (!s) return { ok: false as const, error: "그 학생을 찾을 수 없어요." };
  const now = new Date();
  const e: Entry = {
    id: "f_" + now.getTime(),
    toId: s.id,
    toName: s.name,
    fromName: b.fromName,
    flower: b.flower,
    message: b.message,
    x: Math.round(Math.random() * 1000) / 1000,
    scale: Math.round((0.82 + Math.random() * 0.46) * 100) / 100,
    createdAt: now.toISOString().slice(0, 19),
    dateKey: now.toISOString().slice(0, 10),
  };
  demoEntries.push(e);
  return { ok: true as const, data: { id: e.id, toName: s.name } };
}

function withCounts(): Student[] {
  return demoStudents.map((s) => ({
    ...s,
    flowers: demoEntries.filter((e) => e.toId === s.id).length,
  }));
}

/* ── 바깥에서 쓰는 함수들 ─────────────────── */

export async function getRoster() {
  if (isDemo) return { ok: true as const, data: { total: demoEntries.length, students: withCounts() } };
  return callGas<{ total: number; students: Student[] }>({ action: "roster" });
}

export async function getGarden() {
  if (isDemo) {
    const ranking = withCounts()
      .map((s) => ({ name: s.name, flowers: s.flowers }))
      .sort((a, b) => b.flowers - a.flowers);
    return {
      ok: true as const,
      data: {
        total: demoEntries.length,
        studentCount: demoStudents.length,
        latestAt: demoEntries.at(-1)?.createdAt ?? "",
        ranking,
        entries: demoEntries,
      },
    };
  }
  return callGas<{
    total: number;
    studentCount: number;
    latestAt: string;
    ranking: { name: string; flowers: number }[];
    entries: Entry[];
  }>({ action: "garden" });
}

export async function getBouquet(studentId: string, pin: string) {
  if (isDemo) {
    const s = demoStudents.find((x) => x.id === studentId);
    if (!s) return { ok: false as const, error: "그 학생을 찾을 수 없어요." };
    const mine = demoEntries.filter((e) => e.toId === studentId);
    return { ok: true as const, data: { student: s, total: mine.length, entries: mine } };
  }
  return callGas<{ student: { id: string; name: string; group: string }; total: number; entries: Entry[] }>({
    action: "bouquet",
    params: { studentId, pin },
  });
}

export async function plantFlower(body: {
  toId: string;
  fromName: string;
  flower: string;
  message: string;
}) {
  if (isDemo) return demoPlant(body);
  return callGas<{ id: string; toName: string }>({ action: "plant", body });
}
