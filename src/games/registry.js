/*
 * 게임 목록. 새 게임 = 컴포넌트를 만들고 여기에 한 줄 등록.
 * 게임 컴포넌트 규격: ({ players: [{ id, name }], onFinish(loserId | loserIds[]) }) — 결과는 게임 안에서
 * 시작할 때 확정하고, 연출이 끝나면 onFinish 를 한 번만 부른다.
 * 결판이 안 나면(동점) onFinish 대신 onTie(동점자 id 배열) — 동점자끼리 다시 하거나 다른 게임을 고르게 한다.
 * component 가 null 이면 준비 중.
 * releaseAt: "YYYY-MM-DD" 면 그날 0시(한국 시간)부터 열린다 — 새 게임은 매주 월요일 하나씩 공개.
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
import {
  RouletteIcon, LadderIcon, BombIcon, PirateIcon, CrocodileIcon,
  TapBattleIcon, FingerIcon, UpDownIcon, TenSecIcon, RaceIcon,
} from "./gameIcons.js";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 15; // 뭐먹지 인원 상한(MAX_PEOPLE)과 같게 유지

export const GAMES = [
  { id: "roulette", name: "룰렛", emoji: "🎯", icon: RouletteIcon, desc: "원판을 돌려 한 명을 뽑아요", component: RouletteGame },
  { id: "ladder", name: "사다리 타기", emoji: "🪜", icon: LadderIcon, desc: "당첨 칸 개수를 정하고 사다리를 타요", component: LadderGame },
  { id: "bomb", name: "폭탄 돌리기", emoji: "💣", icon: BombIcon, desc: "터질 때 들고 있으면 당첨", component: BombGame },
  { id: "pirate", name: "해적룰렛", emoji: "🏴‍☠️", icon: PirateIcon, desc: "해적을 튀어나오게 하면 당첨", component: PirateGame },
  { id: "crocodile", name: "악어이빨", emoji: "🐊", icon: CrocodileIcon, desc: "아픈 이빨을 누르면 당첨", component: CrocodileGame },

  { id: "tap", name: "터치 대결", emoji: "⚡", icon: TapBattleIcon, desc: "2명은 화면 땅따먹기, 3명부터는 5초 연타 — 지면 당첨", component: TapBattleGame },
  { id: "finger", name: "손가락 룰렛", emoji: "👆", icon: FingerIcon, desc: "화면에 손가락을 올리면 한 명 선택", component: FingerGame, releaseAt: "2026-10-05" },
  { id: "updown", name: "숫자 맞추기", emoji: "🔢", icon: UpDownIcon, desc: "폰을 돌아가며 진행 · 약 2~5분 걸려요", component: UpDownGame, releaseAt: "2026-10-12" },
  { id: "tensec", name: "10초 맞추기", emoji: "⏱️", icon: TenSecIcon, desc: "10초에서 가장 먼 사람이 당첨", component: TenSecGame, releaseAt: "2026-10-19" },
  { id: "race", name: "동물 레이스", emoji: "🏇", icon: RaceIcon, desc: "꼴찌로 들어오면 당첨", component: RaceGame, releaseAt: "2026-10-26" },
];
