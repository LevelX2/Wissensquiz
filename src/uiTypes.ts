import { type State } from "./model";

export type Page =
  | "account"
  | "leaderboard"
  | "home"
  | "topics"
  | "album"
  | "settings"
  | "help"
  | "round"
  | "result";

export type DuelPage = "duels";

export type Mutate = (fn: (s: State) => void) => Promise<State | null>;
