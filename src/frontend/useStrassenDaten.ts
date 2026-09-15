import { useEffect, useState } from "react";
import type { StrassenDaten } from "../shared/types.js";

export type DataState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

/** Lädt eine JSON-Datei aus /data/. path === null bedeutet: noch nicht laden. */
export function useJsonData<T>(path: string | null): DataState<T> {
  const [state, setState] = useState<DataState<T>>({ status: "loading" });

  useEffect(() => {
    if (path === null) return;

    let abgebrochen = false;
    setState({ status: "loading" });

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!abgebrochen) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!abgebrochen) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unbekannter Fehler",
          });
        }
      });

    return () => {
      abgebrochen = true;
    };
  }, [path]);

  return state;
}

export function useStrassenDaten(datei: string | null): DataState<StrassenDaten> {
  return useJsonData<StrassenDaten>(datei ? `/data/${datei}` : null);
}
