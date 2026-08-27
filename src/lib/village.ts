import data from "@/content/village.json";

/** 건물 모양. 새 모양을 추가하려면 VillageMap.tsx의 Building에도 그림을 더한다. */
export type PlaceKind =
  | "gate"
  | "bookhouse"
  | "greenhouse"
  | "postoffice"
  | "plot";

export type PlaceStatus = "open" | "soon" | "landmark";

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  theme: string;
  blurb: string;
  howto: string;
  /** 비어 있으면 「준비 중」으로 보이고 눌러도 이동하지 않는다. */
  href: string;
  accent: string;
  status: PlaceStatus;
  final?: boolean;
};

export type Village = {
  meta: {
    siteName: string;
    tagline: string;
    seoTitle: string;
    description: string;
    keywords: string[];
    exhibition: string;
    verification: { google: string; naver: string };
  };
  hero: { eyebrow: string; title: string; lines: string[]; cta: string; tourCta: string };
  guide: { title: string; steps: { icon: string; text: string }[] };
  places: Place[];
  footer: { note: string; credit: string };
};

export const village = data as Village;

/** 링크가 없는 곳은 자동으로 「준비 중」이 된다. 상태를 손으로 적을 필요가 없다. */
export function statusOf(p: Place): PlaceStatus {
  if (p.status === "landmark") return "landmark";
  return p.href ? "open" : "soon";
}

/** 실제로 들어갈 수 있는 곳만. 마을 투어와 개수 표시에 쓴다. */
export function visitablePlaces(): Place[] {
  return village.places.filter((p) => statusOf(p) !== "landmark");
}

// ── 계절 ─────────────────────────────────────
// 「10점짜리 행복 정원」과 같은 규칙을 씁니다. 같은 주에 두 앱의 계절이
// 어긋나면 아이들이 헷갈리므로, 주차 계산과 나머지 연산을 그대로 옮겨 왔습니다.

export const SEASONS = ["봄", "여름", "가을", "겨울"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_ICON: Record<Season, string> = {
  봄: "🌸",
  여름: "☀️",
  가을: "🍂",
  겨울: "❄️",
};

/** 서버(UTC)와 브라우저(어느 지역이든)가 같은 답을 내도록 한국 날짜로 고정한다. */
function seoulYMD(now: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = parts.split("-").map(Number);
  return [y, m, d];
}

/** ISO 주차 키 (yyyy-Www). 행복정원 code.gs의 getWeekKey와 같은 계산. */
export function weekKey(now: Date = new Date()): string {
  const [y, m, day] = seoulYMD(now);
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const wn =
    1 +
    Math.round(
      ((d.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7
    );
  return d.getUTCFullYear() + "-W" + String(wn).padStart(2, "0");
}

/** 행복정원 code.gs의 keyToSeason과 같은 식. */
export function seasonOfWeek(key: string): Season {
  const [y, w] = key.split("-W");
  return SEASONS[(parseInt(y, 10) * 53 + parseInt(w, 10)) % 4];
}

export function currentSeason(now: Date = new Date()): Season {
  return seasonOfWeek(weekKey(now));
}

// ── 지도 좌표 ────────────────────────────────
// 건물을 추가하면 길이 알아서 늘어나도록, 좌표는 순서에서 계산한다.

export const MAP = {
  /** 지도 SVG의 가로 기준값. 모든 좌표가 이 폭 안에서 계산된다. */
  width: 360,
  /** 한 정거장이 차지하는 세로 길이. */
  stop: 196,
  topPad: 96,
  botPad: 104,
  /** 길이 좌우로 흔들리는 폭. */
  sway: 54,
  /** 건물이 길에서 떨어져 앉는 거리. */
  offset: 78,
} as const;

export function mapHeight(count: number): number {
  return MAP.topPad + MAP.stop * count + MAP.botPad;
}

/** 정거장 i의 세로 중심. */
export function stopY(i: number): number {
  return MAP.topPad + MAP.stop * i + MAP.stop / 2;
}

/** 짝수번째는 길이 오른쪽으로, 홀수번째는 왼쪽으로 휜다. */
export function roadX(i: number): number {
  return MAP.width / 2 + (i % 2 === 0 ? MAP.sway : -MAP.sway);
}

/** 건물은 길 반대편에 앉는다. */
export function placeX(i: number): number {
  return MAP.width / 2 + (i % 2 === 0 ? -MAP.offset : MAP.offset);
}

/** 정거장들을 부드럽게 잇는 길. 건물 수가 바뀌면 길이도 따라 바뀐다. */
export function roadPath(count: number): string {
  const h = mapHeight(count);
  const pts: [number, number][] = [[MAP.width / 2, h]];
  for (let i = count - 1; i >= 0; i--) pts.push([roadX(i), stopY(i)]);
  pts.push([MAP.width / 2, 0]);

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const my = (py + y) / 2;
    d += ` C ${px} ${my}, ${x} ${my}, ${x} ${y}`;
  }
  return d;
}

/** 나무·풀 같은 장식은 매번 같은 자리에 있어야 한다(서버·브라우저 불일치 방지). */
export function scatter(count: number, seed: number) {
  const out: { x: number; y: number; s: number; k: number }[] = [];
  let v = seed;
  const rnd = () => {
    v = (v * 1103515245 + 12345) % 2147483648;
    return v / 2147483648;
  };
  for (let i = 0; i < count; i++) {
    out.push({ x: rnd(), y: rnd(), s: 0.7 + rnd() * 0.6, k: Math.floor(rnd() * 3) });
  }
  return out;
}
