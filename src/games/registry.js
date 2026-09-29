/*
 * 게임 목록. 새 게임 = 컴포넌트를 만들고 여기에 한 줄 등록.
 * 게임 컴포넌트 규격: ({ players: [{ id, name }], onFinish(loserId | loserIds[]) }) — 결과는 게임 안에서
 * 시작할 때 확정하고, 연출이 끝나면 onFinish 를 한 번만 부른다.
 * tier: "free" 는 누구나, "premium" 은 결제 후(entitlements.canPlay). component 가 null 이면 준비 중.
 */
import { RouletteGame } from "./RouletteGame.js";
import { LadderGame } from "./LadderGame.js";
import { BombGame } from "./BombGame.js";
import { PirateGame } from "./PirateGame.js";
import { CrocodileGame } from "./CrocodileGame.js";
import { TapBattleGame } from "./TapBattleGame.js";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

export const GAMES = [
  { id: "roulette", name: "룰렛", emoji: "🎯", desc: "원판을 돌려 한 명을 뽑아요", tier: "free", component: RouletteGame },
  { id: "ladder", name: "사다리 타기", emoji: "🪜", desc: "당첨 칸 개수를 정하고 사다리를 타요", tier: "free", component: LadderGame },
  { id: "bomb", name: "폭탄 돌리기", emoji: "💣", desc: "터질 때 들고 있으면 당첨", tier: "free", component: BombGame },
  { id: "pirate", name: "해적룰렛", emoji: "🏴‍☠️", desc: "해적을 튀어나오게 하면 당첨", tier: "free", component: PirateGame },
  { id: "crocodile", name: "악어이빨", emoji: "🐊", desc: "아픈 이빨을 누르면 당첨", tier: "free", component: CrocodileGame },

  { id: "tap", name: "터치 대결", emoji: "⚡", desc: "2명은 화면 땅따먹기, 3명부터는 5초 연타 — 지면 당첨", tier: "free", component: TapBattleGame },
  { id: "finger", name: "손가락 룰렛", emoji: "👆", desc: "화면에 손가락을 올리면 한 명 선택", tier: "free", component: null },
  { id: "updown", name: "업다운 숫자폭탄", emoji: "🔢", desc: "숨은 숫자를 부르면 당첨", tier: "free", component: null },
  { id: "tensec", name: "10초 맞추기", emoji: "⏱️", desc: "10초에서 가장 먼 사람이 당첨", tier: "free", component: null },
  { id: "race", name: "동물 레이스", emoji: "🏇", desc: "꼴찌로 들어오면 당첨", tier: "free", component: null },
];
