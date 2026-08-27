import { FlowerStem } from "./Flower";
import type { Entry } from "@/lib/gardenTypes";

const ROW_H = 74;
const PAD_TOP = 46;
const PAD_BOT = 26;

/** 꽃을 몇 줄로 나눠 심을지. 화면이 넓으면 한 줄에 더 많이 들어갑니다. */
export function gardenLayout(count: number, width: number) {
  const perRow = Math.max(6, Math.min(20, Math.round(width / 52)));
  const rows = Math.max(1, Math.ceil(count / perRow));
  return {
    perRow,
    rows,
    rowH: ROW_H,
    padTop: PAD_TOP,
    padBot: PAD_BOT,
    height: PAD_TOP + rows * ROW_H + PAD_BOT,
  };
}

/**
 * 모두의 정원 / 내 꽃다발이 함께 쓰는 그림입니다.
 * 밭고랑은 언제나 **아래에 붙고** 남는 자리는 하늘이 됩니다.
 * (태블릿처럼 세로로 긴 화면에서 정원이 위에 조그맣게 뜨지 않도록.)
 *
 * `aspect`(가로/세로)를 주면 그 비율에 맞춰 하늘을 넉넉히 채웁니다.
 */
export function Garden({
  entries,
  width = 720,
  aspect,
  emptyLabel = "아직 꽃이 없어요",
}: {
  entries: Entry[];
  width?: number;
  aspect?: number;
  emptyLabel?: string;
}) {
  const { perRow, rows, rowH, padBot, height: contentH } = gardenLayout(entries.length, width);
  const height = aspect && aspect > 0 ? Math.max(contentH, Math.round(width / aspect)) : contentH;

  // 맨 앞줄이 바닥에 닿고, 뒷줄이 위로 쌓입니다.
  const groundYOf = (r: number) => height - padBot - (rows - 1 - r) * rowH;
  const skyLine = groundYOf(0);

  return (
    <svg
      className="gb-gardenSvg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={entries.length ? `꽃 ${entries.length}송이가 심어진 정원` : emptyLabel}
    >
      <defs>
        <linearGradient id="gb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe6f5" />
          <stop offset="1" stopColor="#eef6ef" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={width} height={height} fill="url(#gb-sky)" />

      {/* 해 */}
      <circle cx={width * 0.86} cy={Math.min(64, skyLine * 0.3)} r="26" fill="#fdf0c4" opacity="0.9" />

      {/* 뒤쪽 언덕 — 맨 뒷줄 바로 위에 앉습니다 */}
      <ellipse cx={width * 0.2} cy={skyLine - 4} rx={width * 0.34} ry="32" fill="#cfe3c0" opacity="0.8" />
      <ellipse cx={width * 0.78} cy={skyLine - 10} rx={width * 0.32} ry="28" fill="#d8e9c9" opacity="0.75" />

      {Array.from({ length: rows }, (_, r) => {
        const groundY = groundYOf(r);
        const slice = entries.slice(r * perRow, (r + 1) * perRow);
        const depth = rows > 1 ? 0.86 + (0.14 * r) / (rows - 1) : 1;

        return (
          <g key={r}>
            <rect
              x="0"
              y={groundY}
              width={width}
              height={height - groundY}
              fill={r % 2 === 0 ? "#cfe0b0" : "#c6d9a6"}
            />
            <rect x="0" y={groundY} width={width} height="4" fill="#b4c893" opacity="0.7" />

            {slice.map((e, i) => {
              const slot = width / (slice.length + 1);
              const jitter = (e.x - 0.5) * slot * 0.5;
              const x = slot * (i + 1) + jitter;
              const s = (e.scale || 1) * depth;
              return (
                <FlowerStem
                  key={e.id}
                  id={e.flower}
                  x={x}
                  groundY={groundY + 3}
                  headR={13 * s}
                  stemLen={38 * s}
                />
              );
            })}
          </g>
        );
      })}

      {entries.length === 0 && (
        <text
          x={width / 2}
          y={skyLine - 46}
          textAnchor="middle"
          fill="#7d8f6c"
          fontSize="17"
          fontFamily="var(--cv-font-hand)"
        >
          {emptyLabel}
        </text>
      )}
    </svg>
  );
}
