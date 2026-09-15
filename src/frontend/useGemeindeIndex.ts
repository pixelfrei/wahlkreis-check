import type { GemeindeIndex } from "../shared/types.js";
import { useJsonData, type DataState } from "./useStrassenDaten.js";

export function useGemeindeIndex(): DataState<GemeindeIndex> {
  return useJsonData<GemeindeIndex>("/data/gemeinden.json");
}
