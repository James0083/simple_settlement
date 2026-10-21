/*
 * 게임 목록. 새 게임 = 컴포넌트를 만들고 여기에 한 줄 등록.
 * 게임 컴포넌트 규격: ({ players: [{ id, name }], onFinish(loserId | loserIds[], extra?) }) — 결과는 게임 안에서
 * 시작할 때 확정하고, 연출이 끝나면 onFinish 를 한 번만 부른다.
 * extra.amounts({ [id]: 금액 }) · extra.total 을 넘기면 "정산에 추가"가 각자 금액이 채워진 회차를 만든다(복불복 나눠내기).
 * 결판이 안 나면(동점) onFinish 대신 onTie(동점자 id 배열) — 동점자끼리 다시 하거나 다른 게임을 고르게 한다.
 * component 가 null 이면 준비 중.
 * releaseAt: "YYYY-MM-DD" 면 그날 0시(한국 시간)부터 열린다 — 새 게임은 매주 월요일 하나씩 공개.
 *   공개일이 지나면 releaseAt 을 지운다(없으면 이미 공개로 본다). npm test 가 지난 날짜를 잡아낸다.
 * exactPlayers: 숫자면 정확히 그 인원일 때만 할 수 있다(숨바꼭질은 2명).
 * minPlayers · maxPlayers: 이 게임만의 인원 범위(라이어 게임은 3~10명). 없으면 MIN_PLAYERS ~ MAX_PLAYERS.
 * pinFirst: 공개되는 순간 목록 맨 앞에 보인다(공개 전에는 제자리에서 잠금 표시). releaseAt 을 지운 뒤에도 맨 앞에 남는다.
 */
import { RouletteGame } from "./RouletteGame.js";
import { LadderGame } from "./LadderGame.js";
import { BombGame } from "./BombGame.js";
import { PirateGame } from "./PirateGame.js";
import { CrocodileGame } from "./CrocodileGame.js";
import { TapBattleGame } from "./TapBattleGame.js";
import { FingerGame } from "./FingerGame.js";
import { UpDownGame } from "./UpDownGame.js";
import { TenSecGame } from "./TenSecGame.js";
import { RaceGame } from "./RaceGame.js";
import { HideSeekGame } from "./HideSeekGame.js";
import { ReactionGame } from "./ReactionGame.js";
import { SplitLuckGame } from "./SplitLuckGame.js";
import { StackGame } from "./StackGame.js";
import { SimonGame } from "./SimonGame.js";
import { LiarGame } from "./LiarGame.js";
import { isReleased } from "../shared/entitlements.js";
import {
  RouletteIcon, LadderIcon, BombIcon, PirateIcon, CrocodileIcon,
  TapBattleIcon, FingerIcon, UpDownIcon, TenSecIcon, RaceIcon, HideSeekIcon,
  ReactionIcon, SplitLuckIcon, StackIcon, SimonIcon, LiarIcon,
} from "./gameIcons.js";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 15; // 뭐먹지 인원 상한(MAX_PEOPLE)과 같게 유지

// 이 게임의 인원 범위 [최소, 최대]
export const playerRangeOf = (game) =>
  game.exactPlayers
    ? [game.exactPlayers, game.exactPlayers]
    : [game.minPlayers ?? MIN_PLAYERS, game.maxPlayers ?? MAX_PLAYERS];

// 이 게임을 지금 인원으로 할 수 있는지
export const playersOkFor = (game, count) => {
  const [min, max] = playerRangeOf(game);
  return count >= min && count <= max;
};

export const GAMES = [
  { id: "roulette", name: "룰렛", emoji: "🎯", icon: RouletteIcon, desc: "원판을 돌려 한 명을 뽑아요", component: RouletteGame },
  { id: "ladder", name: "사다리 타기", emoji: "🪜", icon: LadderIcon, desc: "당첨 칸 개수를 정하고 사다리를 타요", component: LadderGame },
  { id: "bomb", name: "폭탄 돌리기", emoji: "💣", icon: BombIcon, desc: "터질 때 들고 있으면 당첨", component: BombGame },
  { id: "pirate", name: "해적룰렛", emoji: "🏴‍☠️", icon: PirateIcon, desc: "해적을 튀어나오게 하면 당첨", component: PirateGame },
  { id: "crocodile", name: "악어이빨", emoji: "🐊", icon: CrocodileIcon, desc: "아픈 이빨을 누르면 당첨", component: CrocodileGame },

  { id: "tap", name: "터치 대결", emoji: "⚡", icon: TapBattleIcon, desc: "2명은 화면 땅따먹기, 3명부터는 5초 연타 — 지면 당첨", component: TapBattleGame },
  { id: "finger", name: "손가락 룰렛", emoji: "👆", icon: FingerIcon, desc: "화면에 손가락을 올리면 한 명 선택", component: FingerGame },
  { id: "updown", name: "숫자 맞추기", emoji: "🔢", icon: UpDownIcon, desc: "폰을 돌아가며 진행 · 약 2~5분 걸려요", component: UpDownGame },
  { id: "tensec", name: "10초 맞추기", emoji: "⏱️", icon: TenSecIcon, desc: "10초에서 가장 먼 사람이 당첨", component: TenSecGame },
  { id: "race", name: "동물 레이스", emoji: "🏇", icon: RaceIcon, desc: "꼴찌로 들어오면 당첨", component: RaceGame, releaseAt: "2026-10-26" },
  { id: "hideseek", name: "숨바꼭질", emoji: "🕵️", icon: HideSeekIcon, desc: "2명 전용 · 말을 숨기고 상대 말을 먼저 다 찾으면 승리", component: HideSeekGame, releaseAt: "2026-11-02", exactPlayers: 2 },
  { id: "reaction", name: "반응속도", emoji: "🚦", icon: ReactionIcon, desc: "초록불이 켜지면 누르기 · 가장 느리면 당첨", component: ReactionGame, releaseAt: "2026-11-09" },
  { id: "splitluck", name: "복불복 나눠내기", emoji: "🧧", icon: SplitLuckIcon, desc: "총액을 봉투에 무작위로 나눠 각자 낼 금액 뽑기", component: SplitLuckGame, releaseAt: "2026-11-16", pinFirst: true },
  { id: "stack", name: "탑 쌓기", emoji: "🧱", icon: StackIcon, desc: "블록을 이어 쌓다가 놓치면 당첨", component: StackGame, releaseAt: "2026-11-23" },
  { id: "simon", name: "기억력 릴레이", emoji: "🎵", icon: SimonIcon, desc: "앞사람 순서 따라 누르고 하나 더 · 틀리면 당첨", component: SimonGame, releaseAt: "2026-11-30" },
  { id: "liar", name: "라이어 게임", emoji: "🤥", icon: LiarIcon, desc: "3~10명 · 제시어를 모르는 라이어 찾기 · 약 5~10분", component: LiarGame, releaseAt: "2026-12-07", minPlayers: 3, maxPlayers: 10 },
];

// 게임 목록에 보이는 순서 — 공개된 pinFirst 게임을 맨 앞으로, 나머지는 GAMES 순서 그대로
export const gamesInListOrder = (games = GAMES, released = isReleased) => {
  const pinned = games.filter((g) => g.pinFirst && released(g));
  return [...pinned, ...games.filter((g) => !pinned.includes(g))];
};
