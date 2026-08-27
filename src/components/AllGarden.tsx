"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Garden } from "./Garden";
import { FlowerHead } from "./Flower";
import { downloadGardenCard } from "@/lib/card";
import type { Entry } from "@/lib/gardenTypes";

type GardenData = {
  total: number;
  studentCount: number;
  latestAt: string;
  ranking: { name: string; flowers: number }[];
  entries: Entry[];
};

const POLL_MS = 15000;

/** 전자칠판·태블릿에 띄우는 화면입니다. 손대지 않아도 저절로 새로 고쳐집니다. */
export default function AllGarden({ board = false }: { board?: boolean }) {
  const [data, setData] = useState<GardenData | null>(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const prevTotal = useRef(0);

  // 태블릿 화면에서는 정원이 무대를 꽉 채워야 합니다.
  // 무대 크기를 재서 그 비율을 정원에 넘겨 줍니다.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState(1.8);

  const load = useCallback(async () => {
    try {
      const j = await (await fetch("/api/guestbook?action=garden", { cache: "no-store" })).json();
      setDemo(!!j.demo);
      if (j.ok) {
        setData(j.data);
        setErr("");
      } else setErr(j.error || "정원을 불러오지 못했어요.");
    } catch {
      setErr("연결이 끊겼어요. 다시 시도하는 중이에요…");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // 최근 방명록을 한 줄씩 번갈아 보여 줍니다.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (data) prevTotal.current = data.total;
  }, [data]);

  useEffect(() => {
    const el = stageRef.current;
    if (!board || !el) return;
    // ResizeObserver는 화면을 그리는 단계에서만 불립니다. 탭이 뒤에 있거나
    // 프레임이 멈춘 상황에서는 한 번도 안 불릴 수 있으므로, 먼저 직접 잽니다.
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setAspect(r.width / r.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [board]);

  const recent = data ? [...data.entries].slice(-24).reverse() : [];
  const shown = recent.length ? recent[tick % recent.length] : null;

  const saveCard = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await downloadGardenCard({
        entries: data.entries,
        exhibitionName: "진로탐구아카데미 전시",
        studentCount: data.studentCount,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "카드를 만들지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 태블릿 전용 큰 화면 ── */
  if (board) {
    return (
      <div className="gb-board">
        <div className="gb-boardHead">
          <h1 className="gb-boardTitle">모두의 정원</h1>
          <div className="gb-boardCount">
            {data ? `꽃 ${data.total}송이 · ${data.studentCount}명의 정원` : "부르는 중…"}
          </div>
        </div>

        {demo && (
          <div className="gb-demo" style={{ margin: 0 }}>
            <strong>데모 모드</strong> — 구글 시트가 아직 연결되지 않았습니다.
          </div>
        )}
        {err && <div className="gb-err" style={{ margin: 0 }}>{err}</div>}

        <div className="gb-boardStage" ref={stageRef}>
          <Garden
            entries={data?.entries ?? []}
            width={1200}
            aspect={aspect}
            emptyLabel="첫 번째 꽃을 기다리고 있어요"
          />
        </div>

        <div className="gb-ticker">
          {shown ? (
            <span className="gb-tickerItem" key={shown.id + tick}>
              「{shown.message}」 &nbsp;— {shown.fromName || "이름 없는 손님"} → {shown.toName}님
            </span>
          ) : (
            <span>꽃을 놓아 주시면 여기에 그 말이 흘러갑니다.</span>
          )}
        </div>
      </div>
    );
  }

  /* ── 보통 화면 ── */
  return (
    <div className="gb-wrap">
      <div className="gb-top">
        <Link className="gb-back" href="/guestbook">
          ← 꽃 우체국
        </Link>
        <h1 className="gb-h1">모두의 정원</h1>
        <p className="gb-sub">놓고 가신 꽃이 모두 여기에 함께 핍니다.</p>
      </div>

      {demo && (
        <div className="gb-demo">
          <strong>데모 모드입니다.</strong> 구글 시트를 연결하기 전이라, 서버를 다시 켜면 꽃이 사라집니다.
        </div>
      )}
      {err && <div className="gb-err">{err}</div>}

      <div className="gb-stats">
        <div className="gb-stat">
          <div className="gb-statNum">{data?.total ?? "—"}</div>
          <div className="gb-statLabel">놓인 꽃</div>
        </div>
        <div className="gb-stat">
          <div className="gb-statNum">{data?.studentCount ?? "—"}</div>
          <div className="gb-statLabel">정원 주인</div>
        </div>
      </div>

      <div className="gb-gardenBox">
        <Garden entries={data?.entries ?? []} width={720} emptyLabel="첫 번째 꽃을 기다리고 있어요" />
      </div>

      <div className="gb-actions">
        <button className="gb-btn gb-btn--go" onClick={saveCard} disabled={!data?.total || saving}>
          {saving ? "만드는 중…" : "정원 전체를 카드로 내려받기"}
        </button>
      </div>
      <div className="gb-actions">
        <Link className="gb-btn" href="/guestbook/board">
          태블릿용 큰 화면
        </Link>
        <Link className="gb-btn" href="/guestbook">
          꽃 놓으러 가기
        </Link>
      </div>

      <div className="gb-list" style={{ marginTop: 22 }}>
        {recent.length === 0 && <p className="gb-empty">아직 남겨진 말이 없어요.</p>}
        {recent.map((e) => (
          <div className="gb-note" key={e.id}>
            <FlowerHead id={e.flower} size={34} />
            <div className="gb-noteBody">
              <p className="gb-noteMsg">{e.message}</p>
              <div className="gb-noteMeta">
                {e.fromName || "이름을 남기지 않은 손님"} → {e.toName}님 · {e.dateKey}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
