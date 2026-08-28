"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FLOWERS } from "@/lib/flowers";
import { village } from "@/lib/village";
import { FlowerHead } from "./Flower";
import { GbNav } from "./GbNav";

type Student = { id: string; name: string; group: string; note?: string; flowers: number };

const STEP_LABEL = [
  { title: "누구에게 놓을까요?", hint: "오늘 만난 사람, 마음이 간 사람 — 한 명을 골라 주세요." },
  { title: "어떤 꽃을 놓을까요?", hint: "꽃마다 뜻이 조금씩 달라요." },
  { title: "한 마디 남겨 주세요", hint: "이 글은 그 친구에게 그대로 전해집니다." },
];

export default function GuestbookVisitor() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  const [step, setStep] = useState(0);
  const [toId, setToId] = useState("");
  const [flower, setFlower] = useState("daisy");
  const [message, setMessage] = useState("");
  const [fromName, setFromName] = useState("");

  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/guestbook?action=roster")
      .then((r) => r.json())
      .then((j) => {
        setDemo(!!j.demo);
        if (j.ok) setStudents(j.data.students);
        else setLoadErr(j.error || "명단을 불러오지 못했어요.");
      })
      .catch(() => setLoadErr("명단을 불러오지 못했어요."));
  }, []);

  const target = useMemo(() => students?.find((s) => s.id === toId), [students, toId]);
  const chosen = FLOWERS.find((f) => f.id === flower) ?? FLOWERS[0];

  const submit = async () => {
    setSending(true);
    setSendErr("");
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId, flower, message: message.trim(), fromName: fromName.trim() }),
      });
      const j = await res.json();
      if (!j.ok) setSendErr(j.error || "꽃을 놓지 못했어요.");
      else setDone(true);
    } catch {
      setSendErr("연결이 끊겼어요. 잠시 뒤 다시 눌러 주세요.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setDone(false);
    setStep(0);
    setToId("");
    setMessage("");
    setFlower("daisy");
  };

  /* ── 다 놓았을 때 ── */
  if (done) {
    return (
      <div className="gb-wrap">
        <GbNav />
        <div className="gb-done">
          <div className="gb-doneArt" style={{ width: 108, height: 108 }}>
            <FlowerHead id={flower} size={108} />
          </div>
          <h1 className="gb-doneTitle">
            {target?.name}님의 정원에 {chosen.name} 한 송이가 피었어요
          </h1>
          <p className="gb-doneSub">
            같은 꽃이 <strong>모두의 정원</strong>에도 함께 피었습니다. 남겨 주신 글은 전시가 끝난 뒤 {target?.name}님에게 전해집니다.
          </p>
          <div className="gb-actions">
            <Link className="gb-btn gb-btn--go" href="/guestbook/garden">
              모두의 정원 보기
            </Link>
            <button className="gb-btn" onClick={reset}>
              한 송이 더
            </button>
          </div>
          <div className="gb-actions">
            <Link className="gb-btn" href="/">
              마을로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canNext = step === 0 ? !!toId : step === 1 ? !!flower : message.trim().length > 0;

  return (
    <div className="gb-wrap">
      <div className="gb-top">
        <GbNav />
        <h1 className="gb-h1">꽃 우체국</h1>
        <p className="gb-sub">
          오늘 마을에 와 주셔서 고맙습니다. 꽃 한 송이를 골라 두고 가 주세요.
        </p>
      </div>

      {demo && (
        <div className="gb-demo">
          <strong>데모 모드입니다.</strong> 아직 구글 시트가 연결되지 않아, 여기서 놓은 꽃은 서버를 다시 켜면
          사라집니다. 화면과 흐름을 확인하는 용도로만 써 주세요.
        </div>
      )}

      <div className="gb-steps" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="gb-step" data-on={i <= step} />
        ))}
      </div>

      <h2 className="gb-stepLabel">{STEP_LABEL[step].title}</h2>
      <p className="gb-stepHint">{STEP_LABEL[step].hint}</p>

      {loadErr && <div className="gb-err">{loadErr}</div>}

      {/* 1단계 — 누구에게 */}
      {step === 0 &&
        (students === null ? (
          <p className="gb-empty">명단을 부르는 중이에요…</p>
        ) : students.length === 0 ? (
          <p className="gb-empty">아직 명단이 비어 있어요.</p>
        ) : (
          <div className="gb-grid">
            {students.map((s) => (
              // 받은 꽃 개수는 일부러 보여 주지 않습니다.
              // 숫자가 보이면 적게 받은 사람이 드러나고, 고르는 사람의 선택도 그쪽으로 쏠립니다.
              <button
                key={s.id}
                className="gb-student"
                aria-pressed={toId === s.id}
                onClick={() => {
                  setToId(s.id);
                  setStep(1);
                }}
              >
                <span className="gb-studentName">{s.name}</span>
                {s.group && <span className="gb-studentGroup">{s.group}</span>}
              </button>
            ))}
          </div>
        ))}

      {/* 2단계 — 어떤 꽃 */}
      {step === 1 && (
        <div className="gb-flowers">
          {FLOWERS.map((f) => (
            <button
              key={f.id}
              className="gb-flower"
              aria-pressed={flower === f.id}
              onClick={() => {
                setFlower(f.id);
                setStep(2);
              }}
            >
              <FlowerHead id={f.id} size={54} />
              <div className="gb-flowerName">{f.name}</div>
              <div className="gb-flowerWord">{f.word}</div>
            </button>
          ))}
        </div>
      )}

      {/* 3단계 — 한 마디 */}
      {step === 2 && (
        <>
          <div className="gb-preview">
            <FlowerHead id={flower} size={52} />
            <div className="gb-previewBody">
              <p className="gb-previewTo">
                {target?.name}님에게 · {chosen.name}
              </p>
              <p className="gb-previewMsg">{message.trim() || "여기에 쓴 글이 이렇게 전해져요."}</p>
            </div>
          </div>

          <div className="gb-field">
            <label className="gb-label" htmlFor="gb-msg">
              한 마디
            </label>
            <textarea
              id="gb-msg"
              className="gb-textarea"
              rows={4}
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="오늘 본 것 중에 기억에 남는 것, 응원하고 싶은 말…"
            />
            <div className="gb-count">{message.length} / 200</div>
          </div>

          <div className="gb-field">
            <label className="gb-label" htmlFor="gb-from">
              보내는 사람 <span style={{ opacity: 0.7 }}>(안 적어도 괜찮아요)</span>
            </label>
            <input
              id="gb-from"
              className="gb-input"
              maxLength={20}
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="이름 또는 별명"
            />
          </div>

          {sendErr && <div className="gb-err">{sendErr}</div>}
        </>
      )}

      <div className="gb-actions">
        {step > 0 && (
          <button className="gb-btn gb-btn--back" onClick={() => setStep(step - 1)} disabled={sending}>
            ← 뒤로
          </button>
        )}
        {step < 2 ? (
          <button className="gb-btn gb-btn--go" disabled={!canNext} onClick={() => setStep(step + 1)}>
            다음
          </button>
        ) : (
          <button className="gb-btn gb-btn--rose" disabled={!canNext || sending} onClick={submit}>
            {sending ? "놓는 중…" : "꽃 놓기"}
          </button>
        )}
      </div>

      {/* 손님용 화면이지만, 학생도 여기로 들어옵니다. 자기 꽃다발로 가는 문을 열어 둡니다. */}
      <div className="gb-sideDoor">
        <span>전시에 참여한 학생인가요?</span>
        <Link href="/guestbook/mine">나에게 온 꽃다발 보기 →</Link>
      </div>
    </div>
  );
}
