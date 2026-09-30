/* 오늘 뭐먹지 탭 — 조건을 고르면 메뉴를 추천하고, 지도 검색·정산 회차로 이어준다. */
import { useState, useRef } from "react";
import { html } from "../shared/html.js";
import { styles, C_MUTED } from "../shared/styles.js";
import { load, save } from "../shared/storage.js";
import { navigate } from "../shared/router.js";
import { FOODS, PAIRS } from "./foodData.js";
import { recommend, mealForHour, searchQuery } from "./food.js";
import { TOAST_MS } from "../shared/util.js";
import { ReceiptCard, ScreenHeader } from "../shared/ReceiptCard.js";
import { FoodIcon } from "../shared/icons.js";
import { FoodForm, MAX_PEOPLE } from "./FoodForm.js";
import { FoodResult } from "./FoodResult.js";
import { FoodListScreen } from "./FoodListScreen.js";
import { AdSlot } from "../shared/AdSlot.js";

const HISTORY_KEY = "foodHistory";
const HISTORY_SIZE = 10;

// 실제로 고른 메뉴(지도 열기·복사·정산 추가)를 최근 기록 앞에 넣는다 — 다음 추천에서 감점.
function remember(food) {
  const history = load(HISTORY_KEY, []);
  const list = Array.isArray(history) ? history : [];
  save(HISTORY_KEY, [food.id, ...list.filter((id) => id !== food.id)].slice(0, HISTORY_SIZE));
}

export function FoodScreen({ s }) {
  const [input, setInput] = useState(() => ({
    people: s.validParticipantsCount > 0 ? Math.min(s.validParticipantsCount, MAX_PEOPLE) : 2,
    mode: "dineIn",
    genres: [],
    price: "any",
    exclude: [],
    blocked: [], // 직접 적은 못 먹는 메뉴 [{ word, allow }]
    meal: mealForHour(new Date().getHours()),
  }));
  const [result, setResult] = useState(null);
  const [seen, setSeen] = useState([]);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState("form"); // "form" | "result" | "list"
  const resultRef = useRef(null);

  const changeInput = (next) => {
    setInput(next);
    setSeen([]); // 조건이 바뀌면 "이미 보여준 메뉴" 기록도 새로 시작
  };

  const run = () => {
    const history = load(HISTORY_KEY, []);
    const r = recommend(input, FOODS, { history: Array.isArray(history) ? history : [], seen, pairs: PAIRS });
    const ids = r.picks.map((f) => f.id);
    setSeen(r.reset ? ids : [...seen, ...ids]);
    setResult({ ...r, mode: input.mode, people: input.people });
    setCopied(false);
    setView("form"); // 결과는 form 뷰에서 보여준다
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  // 대안 음식을 cardIndex 위치의 주 추천으로 교체
  const promote = (food, cardIndex = 0) =>
    setResult((prev) => {
      const picks = [...prev.picks];
      const from = picks.findIndex((f) => f.id === food.id);
      if (from === -1) return prev;
      picks.splice(from, 1);
      picks.splice(cardIndex, 0, food);
      return { ...prev, picks };
    });

  // 배달: 주 추천(들) + 곁들임을 합쳐서 복사
  const copy = async (mains, pairMap) => {
    mains.forEach(remember);
    const text = mains
      .map((f) => {
        const pair = pairMap?.[f.id];
        return pair ? `${searchQuery(f)}, ${searchQuery(pair)}` : searchQuery(f);
      })
      .join(" + ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), TOAST_MS);
    } catch (e) {
      setCopied(false);
    }
  };

  const addToSettle = (mains, pairMap) => {
    mains.forEach(remember);
    const title =
      mains.length > 1
        ? `${s.nextRoundNo}차 ${mains.map((m) => m.name).join(" + ")}`
        : `${s.nextRoundNo}차 ${mains[0].name}${pairMap?.[mains[0].id] ? ` + ${pairMap[mains[0].id].name}` : ""}`;
    s.addRoundFrom({ title });
    navigate("settle");
  };

  if (view === "list") {
    return html`
      <${ReceiptCard}>
        <${FoodListScreen} onBack=${() => setView("form")} />
      <//>
    `;
  }

  return html`
    <${ReceiptCard}>
      <${ScreenHeader}
        Icon=${FoodIcon}
        title="오늘 뭐먹지"
        subtitle="인원·장르·가격대만 고르면 메뉴를 딱 정해드려요"
      />

      <div style=${{ textAlign: "right", marginBottom: 8, marginTop: -4 }}>
        <button
          style=${{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C_MUTED,
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 600,
            padding: "2px 0",
            textDecoration: "underline",
          }}
          onClick=${() => setView("list")}
        >
          전체 목록 보기 →
        </button>
      </div>

      <${FoodForm} input=${input} onChange=${changeInput} />

      <${AdSlot} placement="food-form" />

      <button className="settle-calc-btn" style=${{ ...styles.calcBtn, cursor: "pointer" }} onClick=${run}>
        메뉴 정하기
      </button>

      ${result &&
      html`
        <div ref=${resultRef}>
          <div style=${styles.dashedDivider} aria-hidden="true"></div>
          <${FoodResult}
            result=${result}
            mode=${result.mode}
            copied=${copied}
            onPromote=${promote}
            onReroll=${run}
            onChoose=${remember}
            onCopy=${copy}
            onAddToSettle=${addToSettle}
          />
          <${AdSlot} placement="food-result" />
        </div>
      `}
    <//>
  `;
}
