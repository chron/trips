import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from "react";
import { Circle, Loader2, Check } from "lucide-react";

type SaveState = "idle" | "unsaved" | "saving" | "saved";

type SaveIndicatorContextValue = {
  state: SaveState;
  markUnsaved: () => void;
  markSaving: () => void;
  markSaved: () => void;
};

const SaveIndicatorContext = createContext<SaveIndicatorContextValue>({
  state: "idle",
  markUnsaved: () => {},
  markSaving: () => {},
  markSaved: () => {},
});

export function useSaveIndicator() {
  return useContext(SaveIndicatorContext);
}

export function SaveIndicatorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>("idle");
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const markUnsaved = useCallback(() => {
    clearTimeout(fadeTimerRef.current);
    setState("unsaved");
  }, []);

  const markSaving = useCallback(() => {
    clearTimeout(fadeTimerRef.current);
    setState("saving");
  }, []);

  const markSaved = useCallback(() => {
    clearTimeout(fadeTimerRef.current);
    setState("saved");
    fadeTimerRef.current = setTimeout(() => setState("idle"), 2000);
  }, []);

  return (
    <SaveIndicatorContext.Provider value={{ state, markUnsaved, markSaving, markSaved }}>
      {children}
    </SaveIndicatorContext.Provider>
  );
}

export function SaveIndicator() {
  const { state } = useSaveIndicator();

  if (state === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {state === "unsaved" && (
        <Circle className="h-3 w-3 fill-current opacity-40" />
      )}
      {state === "saving" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {state === "saved" && (
        <Check className="h-3 w-3 text-emerald-500 animate-in fade-in duration-200" />
      )}
      <span className="text-[10px] font-medium">
        {state === "unsaved" && "Unsaved"}
        {state === "saving" && "Saving…"}
        {state === "saved" && "Saved"}
      </span>
    </div>
  );
}
