import data from "@/content/village.json";

/** 건물 모양. 새 모양을 추가하려면 VillageMap.tsx의 Building에도 그림을 더한다. */
export type PlaceKind =
  | "gate"
  | "library"
  | "bookhouse"
  | "greenhouse"
  | "postoffice"
  | "gym"
  | "drawer"
  | "tower"
  | "signpost"
  | "workshop"
  | "lab"
  | "hanok"
  | "clinic"
  | "observatory"
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
  /** 들어가는 단추에 쓸 말. 없으면 「들어가기」. */
  enter?: string;
  /**
   * 한 곳에 문이 둘일 때 쓰는 두 번째 단추.
   * 행복정원처럼 「내 정원(학생용)」과 「전체 정원(전자칠판)」이 갈리는 경우.
   * href 가 비면 단추를 아예 그리지 않는다.
   */
  extra?: { label: string; href: string; hint?: string };
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

/* ==========================================================
   지도 — 찌그러진 고리 모양 마을길

   예전에는 위아래로 굽은 한 줄 길이었습니다. 건물이 넷일 때는 괜찮았지만
   열 곳이 넘어가니 끝없이 늘어지기만 해서, 마을을 한 바퀴 도는 고리로
   바꿨습니다. 사인파 둘을 겹쳐 **일부러 찌그러뜨립니다** — 자로 잰 듯한
   원은 마을길로 보이지 않습니다.

   여기서 두 가지를 조심해야 합니다. 둘 다 처음에 틀렸다가 고친 것입니다.

   1. **각도를 균등하게 나누면 안 됩니다.** 길쭉한 고리에서는 위아래 끝에
      점이 뭉쳐서 건물이 겹칩니다. 길이(호 길이)를 균등하게 나눠야 합니다.
   2. **중심 방향으로 물러나게 하면 안 됩니다.** 곡선에서는 중심 방향과
      길에 대한 수직 방향이 달라서, 어떤 건물은 길 위에 올라앉습니다.
      길의 **법선** 방향으로 물러나야 어디서나 같은 간격이 납니다.

   좌표는 여전히 「몇 번째 건물인가」에서만 계산합니다. JSON에 한 덩어리를
   더하면 고리가 알아서 늘어나고 자리도 다시 잡힙니다.
   ========================================================== */

export const MAP = {
  /** 지도 SVG의 가로 기준값. 모든 좌표가 이 폭 안에서 계산된다. */
  width: 360,
  /** 고리의 가로 반지름. 폰 화면 폭에 맞춰 고정한다. */
  rx: 64,
  /** 건물 하나가 차지하는 길 길이. 이 값으로 고리의 세로 길이가 정해진다. */
  arc: 150,
  /**
   * 길 한가운데에서 건물 한가운데까지의 거리.
   * 건물 반폭(약 40)과 길 반폭(18)을 더한 58보다 넉넉해야 겹치지 않는다.
   */
  inset: 70,
} as const;

/** 사인파 둘을 겹쳐 고리를 찌그러뜨린다. 늘 같은 값이라야 서버·브라우저가 안 어긋난다. */
function wobble(t: number): number {
  const a = t * Math.PI * 2;
  return 1 + 0.085 * Math.sin(3 * a + 0.7) + 0.05 * Math.sin(5 * a + 2.3);
}

function ellipsePerimeter(a: number, b: number): number {
  const h = (a - b) ** 2 / (a + b) ** 2;
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/** 건물이 arc 만큼씩 떨어져 앉도록 고리의 세로 반지름을 정한다. */
export function ringRy(count: number): number {
  const target = Math.max(count, 5) * MAP.arc;
  // MAP 이 as const 라 MAP.rx 를 그대로 넣으면 리터럴 타입으로 굳는다.
  let lo: number = MAP.rx;
  let hi = 6000;
  for (let i = 0; i < 46; i++) {
    const mid = (lo + hi) / 2;
    if (ellipsePerimeter(MAP.rx, mid) < target) lo = mid;
    else hi = mid;
  }
  return Math.round(lo);
}

/** 찌그러진 만큼 위아래로 삐져나가므로 여백도 같이 늘린다. */
function padY(count: number): number {
  return Math.round(ringRy(count) * 0.14) + 54;
}

export function mapHeight(count: number): number {
  return ringRy(count) * 2 + padY(count) * 2;
}

function centerY(count: number): number {
  return padY(count) + ringRy(count);
}

/** 고리 위의 한 점. t는 0에서 1까지, 0이 맨 위(마을 입구 쪽). */
export function roadPoint(t: number, count: number): { x: number; y: number } {
  const a = t * Math.PI * 2 - Math.PI / 2;
  const w = wobble(t);
  return {
    x: MAP.width / 2 + MAP.rx * w * Math.cos(a),
    y: centerY(count) + ringRy(count) * w * Math.sin(a),
  };
}

/**
 * 길이를 균등하게 나누기 위한 표.
 * t를 촘촘히 훑으며 그때까지의 길이를 적어 둔다. 건물 수마다 한 번만 만든다.
 */
const arcTables = new Map<number, { t: number[]; s: number[]; total: number }>();

function arcTable(count: number) {
  const hit = arcTables.get(count);
  if (hit) return hit;

  const N = 1440;
  const t: number[] = [0];
  const s: number[] = [0];
  let prev = roadPoint(0, count);
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const tt = i / N;
    const p = roadPoint(tt, count);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y);
    t.push(tt);
    s.push(acc);
    prev = p;
  }
  const table = { t, s, total: acc };
  arcTables.set(count, table);
  return table;
}

/** 길을 따라 length 만큼 걸어간 자리의 t. */
function tAtLength(length: number, count: number): number {
  const { t, s, total } = arcTable(count);
  const target = ((length % total) + total) % total;
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = s[hi] - s[lo] || 1;
  const k = (target - s[lo]) / span;
  return t[lo] + (t[hi] - t[lo]) * k;
}

/** i번째 건물이 앉는 t — 각도가 아니라 **걸은 거리**로 나눈다. */
export function placeT(i: number, count: number): number {
  if (count <= 0) return 0;
  return tAtLength((arcTable(count).total * i) / count, count);
}

/** 그 자리에서 길 **바깥쪽**을 향하는 단위 벡터(법선). */
function outwardNormal(t: number, count: number): { x: number; y: number } {
  const e = 0.0008;
  const a = roadPoint(t - e, count);
  const b = roadPoint(t + e, count);
  let nx = -(b.y - a.y);
  let ny = b.x - a.x;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;

  // 두 방향 중 마을 **바깥**을 고른다.
  // 안쪽에 앉히면 길쭉한 고리의 위아래 끝에서 건물끼리 만나 버린다
  // (13개 기준 2.5px까지 붙었다). 바깥에 두면 147px 떨어진다.
  const p = roadPoint(t, count);
  const toCenter = { x: MAP.width / 2 - p.x, y: centerY(count) - p.y };
  if (nx * toCenter.x + ny * toCenter.y > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
}

/** 건물은 길 **바깥쪽 법선 방향으로** 물러나 앉는다. 가운데는 마을 마당으로 비운다. */
export function placePoint(i: number, count: number): { x: number; y: number } {
  const t = placeT(i, count);
  const p = roadPoint(t, count);
  const n = outwardNormal(t, count);
  return { x: p.x + n.x * MAP.inset, y: p.y + n.y * MAP.inset };
}

/** 고리 전체를 그리는 닫힌 길. 촘촘히 찍어 이어야 찌그러진 곡선이 매끄럽다. */
export function roadPath(count: number, samples = 240): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const p = roadPoint(i / samples, count);
    d += (i === 0 ? "M " : " L ") + p.x.toFixed(1) + " " + p.y.toFixed(1);
  }
  return d + " Z";
}

/** 건물에서 큰길로 이어지는 짧은 샛길. 이게 있어야 마을처럼 보인다. */
export function drivewayPath(i: number, count: number): string {
  const a = placePoint(i, count);
  const b = roadPoint(placeT(i, count), count);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
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
