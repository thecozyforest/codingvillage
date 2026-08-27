import { flowerOf, type Flower } from "@/lib/flowers";

/** 꽃송이만. 고르는 화면·목록에서 씁니다. */
export function FlowerHead({ id, size = 44 }: { id: string; size?: number }) {
  const f = flowerOf(id);
  return (
    <svg width={size} height={size} viewBox="-1.2 -1.2 2.4 2.4" aria-hidden="true">
      <Shapes f={f} />
    </svg>
  );
}

/** 줄기까지 갖춘 한 송이. 정원에 심을 때 씁니다. */
export function FlowerStem({
  id,
  x,
  groundY,
  headR,
  stemLen,
}: {
  id: string;
  x: number;
  groundY: number;
  headR: number;
  stemLen: number;
}) {
  const f = flowerOf(id);
  const headY = groundY - stemLen;
  return (
    <g>
      <path
        d={`M ${x} ${groundY} Q ${x + headR * 0.22} ${groundY - stemLen * 0.55} ${x} ${headY + headR * 0.4}`}
        stroke={f.stem}
        strokeWidth={Math.max(1.4, headR * 0.15)}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={x - headR * 0.55}
        cy={groundY - stemLen * 0.42}
        rx={headR * 0.5}
        ry={headR * 0.2}
        fill={f.stem}
        opacity="0.9"
        transform={`rotate(-28 ${x - headR * 0.55} ${groundY - stemLen * 0.42})`}
      />
      <g transform={`translate(${x} ${headY}) scale(${headR})`}>
        <Shapes f={f} />
      </g>
    </g>
  );
}

function Shapes({ f }: { f: Flower }) {
  return (
    <>
      {f.shapes.map((s, i) => (
        <ellipse
          key={i}
          cx={s.cx}
          cy={s.cy}
          rx={s.rx}
          ry={s.ry}
          fill={s.fill}
          opacity={s.op ?? 1}
          transform={`rotate(${(s.rot * 180) / Math.PI} ${s.cx} ${s.cy})`}
        />
      ))}
    </>
  );
}
