import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

type HotkeyAction = {
  key: string;
  label: string;
  handler: () => void;
};

type HotkeyContextValue = {
  metaHeld: boolean;
  register: (id: string, action: HotkeyAction) => void;
  unregister: (id: string) => void;
};

const HotkeyContext = createContext<HotkeyContextValue>({
  metaHeld: false,
  register: () => {},
  unregister: () => {},
});

export function useMetaHeld() {
  return useContext(HotkeyContext).metaHeld;
}

export function useHotkey(id: string, key: string, label: string, handler: () => void) {
  const { register, unregister } = useContext(HotkeyContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    register(id, { key, label, handler: () => handlerRef.current() });
    return () => unregister(id);
  }, [id, key, label, register, unregister]);
}

export function HotkeyProvider({ children }: { children: ReactNode }) {
  const [metaHeld, setMetaHeld] = useState(false);
  const actionsRef = useRef<Map<string, HotkeyAction>>(new Map());

  const register = useCallback((id: string, action: HotkeyAction) => {
    actionsRef.current.set(id, action);
  }, []);

  const unregister = useCallback((id: string) => {
    actionsRef.current.delete(id);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Meta" || e.key === "Control") {
        setMetaHeld(true);
        return;
      }

      // Only fire hotkeys when meta/ctrl is held
      if (!(e.metaKey || e.ctrlKey)) return;

      // Don't fire in text inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      for (const action of actionsRef.current.values()) {
        if (e.key.toLowerCase() === action.key.toLowerCase()) {
          e.preventDefault();
          action.handler();
          return;
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "Meta" || e.key === "Control") {
        setMetaHeld(false);
      }
    }

    function handleBlur() {
      setMetaHeld(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <HotkeyContext.Provider value={{ metaHeld, register, unregister }}>
      {children}
    </HotkeyContext.Provider>
  );
}

/** Small badge that appears over a button when meta is held */
export function HotkeyHint({ hotkey }: { hotkey: string }) {
  const { metaHeld } = useContext(HotkeyContext);
  if (!metaHeld) return null;

  const isMac = navigator.platform.includes("Mac");
  const prefix = isMac ? "\u2318" : "Ctrl+";

  return (
    <span className="absolute -top-2 -right-2 z-10 rounded bg-foreground px-1.5 py-0.5 text-[9px] font-mono font-medium text-background shadow-sm pointer-events-none animate-in fade-in duration-100">
      {prefix}{hotkey.toUpperCase()}
    </span>
  );
}
