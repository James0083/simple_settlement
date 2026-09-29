/* 오늘 뭐먹지 탭 — 조건을 고르면 메뉴를 추천하고, 지도 검색·정산 회차로 이어준다. */
import { useState, useRef } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { load, save } from "../shared/storage.js";
import { navigate } from "../shared/router.js";
import { FOODS, PAIRS } from "./foodData.js";
import { recommend, mealForHour, searchQuery } from "./food.js";
import { ReceiptCard, ScreenHeader } from "../shared/ReceiptCard.js";
import { FoodIcon } from "../shared/icons.js";
import { FoodForm } from "./FoodForm.js";
import { FoodResult } from "./FoodResult.js";
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
    people: s.validParticipantsCount > 0 ? s.validParticipantsCount : 2,
    mode: "dineIn",
    genres: [],
    price: "any",
    exclude: [],
    meal: mealForHour(new Date().getHours()),
  }));
  const [result, setResult] = useState(null);
  const [seen, setSeen] = useState([]);
  const [copied, setCopied] = useState(false);
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
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const promote = (food) =>
    setResult((prev) => ({ ...prev, picks: [food, ...prev.picks.filter((f) => f.id !== food.id)] }));

  // 곁들임이 있으면 "치킨, 피자" 처럼 함께 복사한다
  const copy = async (food, pair) => {
    remember(food);
    try {
      await navigator.clipboard.writeText(pair ? `${searchQuery(food)}, ${searchQuery(pair)}` : searchQuery(food));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  const addToSettle = (food, pair) => {
    remember(food);
    s.addRoundFrom({ title: `${s.nextRoundNo}차 ${food.name}${pair ? ` + ${pair.name}` : ""}` });
    navigate("settle");
  };

  return html`
    <${ReceiptCard}>
      <${ScreenHeader}
        Icon=${FoodIcon}
        title="오늘 뭐먹지"
        subtitle="인원·장르·가격대만 고르면 메뉴를 딱 정해드려요"
      />

      <${FoodForm} input=${input} onChange=${changeInput} />

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
