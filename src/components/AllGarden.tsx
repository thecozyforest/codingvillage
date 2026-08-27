"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Garden } from "./Garden";
import { FlowerHead } from "./Flower";
import { downloadGardenCard } from "@/lib/card";
import { village } from "@/lib/village";
import type { Entry, Student } from "@/lib/gardenTypes";

type GardenData = {
  total: number;
  studentCount: number;
  latestAt: string;
  entries: Entry[];
};

const POLL_MS = 15000;
/** 전자칠판은 손을 안 대므로 두 화면이 저절로 번갈아 뜹니다. */
const MODE_MS = 22000;

export default function AllGarden({ board = false }: { board?: boolean }) {
  const [data, setData] = useState<GardenData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<"all" | "plots">("all");
  const [saving, setSaving] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState(1.8);

  const load = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([
        fetch("/api/guestbook?action=garden", { cache: "no-store" }).then((x) => x.json()),
        fetch("/api/guestbook?action=roster", { cache: "no-store" }).then((x) => x.json()),
      ]);
      setDemo(!!g.demo);
      if (g.ok) {
        setData(g.data);
        setErr("");
      } else setErr(g.error || "정원을 불러오지 못했어요.");
      if (r.ok) setStudents(r.data.students);
    } catch {
      setErr("연결이 끊겼어요. 다시 시도하는 중이에요…");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!board) return;
    const id = setInterval(() => setMode((m) => (m === "all" ? "plots" : "all")), MODE_MS);
    return () => clearInterval(id);
  }, [board]);

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
  }, [board, mode]);

  /**
   * 정원별로 묶습니다. 이름이 아니라 id로 묶어야 동명이인이 섞이지 않습니다.
   * 정렬은 **이름순**입니다 — 꽃 수로 줄을 세우면 그게 곧 순위표가 됩니다.
   */
  const plots = useMemo(() => {
    const byId = new Map<string, Entry[]>();
    for (const e of data?.entries ?? []) {
      const arr = byId.get(e.toId);
      if (arr) arr.push(e);
      else byId.set(e.toId, [e]);
    }
    return [...students]
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      .map((s) => ({ student: s, entries: byId.get(s.id) ?? [] }));
  }, [data, students]);

  const recent = data ? [...data.entries].slice(-24).reverse() : [];
  const shown = recent.length ? recent[tick % recent.length] : null;

  const saveCard = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await downloadGardenCard({
        entries: data.entries,
        exhibitionName: village.meta.exhibition,
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
          <h1 className="gb-boardTitle">
            {mode === "all" ? "모두의 꽃밭" : "정원마다 피어난 꽃"}
          </h1>
          <div className="gb-boardCount">
            {data ? `꽃 ${data.total}송이 · ${data.studentCount}명의 정원` : "부르는 중…"}
          </div>
        </div>

        {demo && (
          <div className="gb-demo" style={{ margin: 0 }}>
            <strong>데모 모드</strong> — 구글 시트가 아직 연결되지 않았습니다.
          </div>
        )}
        {err && (
          <div className="gb-err" style={{ margin: 0 }}>
            {err}
          </div>
        )}

        <div className="gb-boardStage" ref={stageRef}>
          {mode === "all" ? (
            <Garden
              entries={data?.entries ?? []}
              width={1200}
              aspect={aspect}
              emptyLabel="첫 번째 꽃을 기다리고 있어요"
            />
          ) : (
            <div className="gb-plots">
              {plots.map(({ student, entries }) => (
                <div className="gb-plot" key={student.id}>
                  <div className="gb-plotGarden">
                    <Garden entries={entries} width={280} aspect={1.5} emptyLabel="" />
                  </div>
                  <div className="gb-plotName">{student.name}</div>
                </div>
              ))}
            </div>
          )}
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
        <p className="gb-sub">놓고 가신 꽃이 저마다의 정원에, 그리고 한 밭에 함께 핍니다.</p>
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

      <div className="gb-segment" role="group" aria-label="보기 방식">
        <button
          className="gb-segBtn"
          aria-pressed={mode === "all"}
          onClick={() => setMode("all")}
        >
          모두의 꽃밭
        </button>
        <button
          className="gb-segBtn"
          aria-pressed={mode === "plots"}
          onClick={() => setMode("plots")}
        >
          정원별로 보기
        </button>
      </div>

      {mode === "all" ? (
        <div className="gb-gardenBox">
          <Garden entries={data?.entries ?? []} width={720} emptyLabel="첫 번째 꽃을 기다리고 있어요" />
        </div>
      ) : (
        <div className="gb-plots gb-plots--page">
          {plots.map(({ student, entries }) => (
            <div className="gb-plot" key={student.id}>
              <div className="gb-plotGarden">
                <Garden entries={entries} width={280} aspect={1.5} emptyLabel="" />
              </div>
              <div className="gb-plotName">{student.name}</div>
            </div>
          ))}
        </div>
      )}

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

      <div className="gb-sideDoor">
        <span>전시에 참여한 학생인가요?</span>
        <Link href="/guestbook/mine">나에게 온 꽃다발 보기 →</Link>
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
