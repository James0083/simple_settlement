/*
 * useSettlement — 앱의 모든 상태(참가자 · 회차 · 계산 결과)와 그로부터 파생되는
 * 값, 이벤트 핸들러를 한곳에 모은다. 화면(App)은 이 훅이 돌려주는 값만 그린다.
 *
 * 모든 계산은 participants 와 rounds, 이 두 상태로부터 파생된다.
 */
import { useState, useMemo, useRef } from "react";
import { uid, makeParticipant, isMobileDevice } from "../lib/util.js";
import {
  isRoundValid,
  computeStats,
  computeFairTransactions,
  groupTransactions,
  buildResultText,
} from "../lib/settlement.js";
import { captureToPng, downloadBlob } from "../lib/exportImage.js";

const makeRound = (participantIds) => ({
  id: uid(),
  title: "",
  payerId: "",
  amount: "",
  participantIds,
});

export function useSettlement() {
  const initialParticipants = useMemo(
    () => [makeParticipant(), makeParticipant(), makeParticipant()],
    []
  );
  const [participants, setParticipants] = useState(initialParticipants);
  const [rounds, setRounds] = useState(() => [makeRound(initialParticipants.map((p) => p.id))]);
  const [calculated, setCalculated] = useState(false);
  const [calcDate, setCalcDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // { url, file }
  const resultRef = useRef(null);
  const captureRef = useRef(null);

  // 입력이 바뀌면 이전 계산 결과는 무효화한다.
  const invalidate = () => setCalculated(false);

  // ── 참가자 ────────────────────────────────────────────────
  const updateParticipantName = (id, name) => {
    invalidate();
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };
  const addParticipant = () => {
    invalidate();
    setParticipants((prev) => [...prev, makeParticipant()]);
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
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id !== roundId) return r;
        const allIds = participants.filter((p) => p.name.trim()).map((p) => p.id);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
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
    removeParticipant,
    // 회차
    rounds,
    addRound,
    updateRound,
    updateRoundAmount,
    removeRound,
    toggleRoundParticipant,
    toggleAllRoundParticipants,
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
    handleCopy,
    downloading,
    handleDownloadImage,
    imagePreview,
    setImagePreview,
    resultRef,
    captureRef,
  };
}
