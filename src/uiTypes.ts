import { type State } from "./model";
import type { WriteOptions } from "./syncTypes";

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

export type Mutate = (
  fn: (s: State) => void,
  options?: WriteOptions,
) => Promise<State | null>;
