/*
 * useSettlement — 앱의 모든 상태(참가자 · 회차 · 계산 결과)와 그로부터 파생되는
 * 값, 이벤트 핸들러를 한곳에 모은다. 화면(App)은 이 훅이 돌려주는 값만 그린다.
 *
 * 모든 계산은 participants 와 rounds, 이 두 상태로부터 파생된다.
 *
 * participants 는 앱 전체의 공유 명단이기도 하다 — 이름·계좌를 기기(localStorage)에 저장해
 * 다음 방문 때 다시 채우고, 뭐먹지·미니게임 탭이 같은 명단을 읽는다.
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { uid, makeParticipant, isMobileDevice } from "../shared/util.js";
import { load, save } from "../shared/storage.js";
import {
  isRoundValid,
  computeStats,
  computeFairTransactions,
  groupTransactions,
  buildResultText,
} from "./settlement.js";
import { captureToPng, downloadBlob } from "./exportImage.js";

const makeRound = (participantIds) => ({
  id: uid(),
  title: "",
  payerId: "",
  amount: "",
  participantIds,
});

// 입력을 하나도 안 건드린 회차 — 다른 탭에서 회차를 넘길 때 이런 빈 회차 하나는 대체한다.
const isBlankRound = (r) => !r.title.trim() && !r.payerId && !r.amount;

// 저장된 명단 → 참가자. 없으면 빈 입력칸 3개 (처음 방문과 같음).
function loadParticipants() {
  const saved = load("roster", []);
  const list = (Array.isArray(saved) ? saved : [])
    .filter((p) => p && typeof p.name === "string" && p.name.trim())
    .map((p) => ({
      ...makeParticipant(p.name),
      account: typeof p.account === "string" ? p.account : "",
    }));
  return list.length > 0 ? list : [makeParticipant(), makeParticipant(), makeParticipant()];
}

export function useSettlement() {
  const initialParticipants = useMemo(loadParticipants, []);
  const [participants, setParticipants] = useState(initialParticipants);
  const [rounds, setRounds] = useState(() => [makeRound(initialParticipants.map((p) => p.id))]);
  const [calculated, setCalculated] = useState(false);
  const [calcDate, setCalcDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // { url, file }
  const resultRef = useRef(null);
  const captureRef = useRef(null);

  // 입력이 바뀌면 이전 계산 결과는 무효화한다.
  const invalidate = () => setCalculated(false);

  // 이름이 있는 참가자만 이름·계좌를 저장한다. (showAccount 는 UI 상태라 저장하지 않음)
  useEffect(() => {
    save(
      "roster",
      participants
        .filter((p) => p.name.trim())
        .map(({ name, account }) => ({ name: name.trim(), account }))
    );
  }, [participants]);

  // ── 참가자 ────────────────────────────────────────────────
  const updateParticipantName = (id, name) => {
    invalidate();
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };
  // 계좌는 금액 계산에 영향이 없으므로 계산 결과(calculated)를 무효화하지 않는다.
  // stats/groupedTransactions 가 participants 를 그대로 파생하므로 입력하는 즉시
  // 이미 계산된 결과 화면에도 반영된다.
  const updateParticipantAccount = (id, account) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, account } : p)));
  };
  const toggleParticipantAccount = (id) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, showAccount: !p.showAccount } : p))
    );
  };
  // 버튼 onClick 에 그대로 물리면 이벤트 객체가 들어오므로 문자열일 때만 이름으로 쓴다.
  // 이름을 붙여 추가하면(미니게임 탭) 비어 있는 입력칸을 먼저 채우고, 없을 때만 새 칸을 만든다.
  const addParticipant = (name) => {
    invalidate();
    const trimmed = typeof name === "string" ? name.trim() : "";
    setParticipants((prev) => {
      const blank = trimmed ? prev.findIndex((p) => !p.name.trim()) : -1;
      if (blank !== -1) return prev.map((p, i) => (i === blank ? { ...p, name: trimmed } : p));
      return [...prev, makeParticipant(trimmed)];
    });
  };
  const removeParticipant = (id) => {
    invalidate();
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setRounds((prev) =>
      prev.map((r) => ({
        ...r,
        payerId: r.payerId === id ? "" : r.payerId,
        participantIds: r.participantIds.filter((pid) => pid !== id),
      }))
    );
  };

  // ── 회차 ─────────────────────────────────────────────────
  const addRound = () => {
    invalidate();
    setRounds((prev) => [...prev, makeRound(participants.map((p) => p.id))]);
  };
  const updateRound = (id, field, value) => {
    invalidate();
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  // 금액은 숫자만 허용하고 맨 앞 0 은 제거한다. ("0" 단독 입력도 빈 값으로)
  const updateRoundAmount = (id, raw) => {
    const digits = String(raw).replace(/[^0-9]/g, "").replace(/^0+/, "");
    updateRound(id, "amount", digits);
  };
  // 다른 탭(뭐먹지·미니게임)에서 회차를 넘겨받는다. participantIds 를 안 주면 이름 있는 참가자 전원.
  // 아직 아무것도 입력하지 않은 회차 하나만 있으면 그것을 대체한다.
  const addRoundFrom = ({ title = "", payerId = "", amount = "", participantIds } = {}) => {
    invalidate();
    const ids = participantIds ?? participants.filter((p) => p.name.trim()).map((p) => p.id);
    setRounds((prev) => {
      const kept = prev.length === 1 && isBlankRound(prev[0]) ? [] : prev;
      return [...kept, { ...makeRound(ids), title, payerId, amount: String(amount) }];
    });
  };
  const removeRound = (id) => {
    invalidate();
    setRounds((prev) => prev.filter((r) => r.id !== id));
  };
  const toggleRoundParticipant = (roundId, participantId) => {
    invalidate();
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id !== roundId) return r;
        const has = r.participantIds.includes(participantId);
        return {
          ...r,
          participantIds: has
            ? r.participantIds.filter((id) => id !== participantId)
            : [...r.participantIds, participantId],
        };
      })
    );
  };
  const toggleAllRoundParticipants = (roundId) => {
    invalidate();
    const allIds = validParticipants.map((p) => p.id);
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id !== roundId) return r;
        const allSelected = allIds.length > 0 && allIds.every((id) => r.participantIds.includes(id));
        return { ...r, participantIds: allSelected ? [] : allIds };
      })
    );
  };

  // ── 파생 값 ──────────────────────────────────────────────
  const validParticipants = useMemo(
    () => participants.filter((p) => p.name.trim().length > 0),
    [participants]
  );
  const validParticipantIdSet = useMemo(
    () => new Set(validParticipants.map((p) => p.id)),
    [validParticipants]
  );

  const isAllSelected = (r) =>
    validParticipants.length > 0 &&
    validParticipants.every((p) => r.participantIds.includes(p.id));

  const stats = useMemo(
    () => computeStats(validParticipants, rounds),
    [validParticipants, rounds]
  );

  const validRoundsCount = useMemo(
    () => rounds.filter((r) => isRoundValid(r, validParticipantIdSet)).length,
    [rounds, validParticipantIdSet]
  );

  const totalAmount = useMemo(() => stats.reduce((s, p) => s + p.paid, 0), [stats]);

  const groupedTransactions = useMemo(() => {
    if (!calculated) return [];
    return groupTransactions(computeFairTransactions(stats));
  }, [calculated, stats]);

  const canCalculate = validParticipants.length >= 2 && validRoundsCount >= 1;

  // ── 액션 ─────────────────────────────────────────────────
  const handleCalculate = () => {
    if (!canCalculate) return;
    setCalculated(true);
    setCalcDate(new Date().toLocaleDateString("ko-KR"));
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildResultText(stats, groupedTransactions));
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 1800);
    }
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const { dataUrl, blob, file } = await captureToPng(captureRef.current);
      if (isMobileDevice()) {
        // 모바일: 브라우저가 이미지 파일 다운로드를 막는 경우가 많아,
        // 이미지를 크게 띄워 "길게 눌러 사진에 추가"로 저장하도록 안내한다.
        setImagePreview({ url: dataUrl, file });
      } else if (blob) {
        downloadBlob(blob, "정산결과.png");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return {
    // 참가자
    participants,
    addParticipant,
    updateParticipantName,
    updateParticipantAccount,
    toggleParticipantAccount,
    removeParticipant,
    // 회차
    rounds,
    addRound,
    updateRound,
    updateRoundAmount,
    removeRound,
    toggleRoundParticipant,
    toggleAllRoundParticipants,
    addRoundFrom,
    // 다음 회차 번호 — 다른 탭이 "2차 마라탕" 같은 회차 이름을 만들 때 쓴다.
    nextRoundNo: rounds.filter((r) => !isBlankRound(r)).length + 1,
    // 파생
    validParticipants,
    isAllSelected,
    stats,
    validParticipantsCount: validParticipants.length,
    validRoundsCount,
    totalAmount,
    groupedTransactions,
    canCalculate,
    calculated,
    calcDate,
    // 액션 · 상태
    handleCalculate,
    copied,
    copyFailed,
    handleCopy,
    downloading,
    handleDownloadImage,
    imagePreview,
    setImagePreview,
    resultRef,
    captureRef,
  };
}
