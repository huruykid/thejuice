import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ViewAsMode = null | "logged_out" | "unverified_user" | "verified_user";

const STORAGE_KEY = "juice:viewAs";

interface ViewAsContextValue {
  viewAs: ViewAsMode;
  setViewAs: (mode: ViewAsMode) => void;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  viewAs: null,
  setViewAs: () => {},
});

export const ViewAsProvider = ({ children }: { children: ReactNode }) => {
  const [viewAs, setViewAsState] = useState<ViewAsMode>(() => {
    if (typeof window === "undefined") return null;
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "logged_out" || v === "unverified_user" || v === "verified_user") return v;
    return null;
  });

  const setViewAs = (mode: ViewAsMode) => {
    setViewAsState(mode);
    if (typeof window === "undefined") return;
    if (mode) sessionStorage.setItem(STORAGE_KEY, mode);
    else sessionStorage.removeItem(STORAGE_KEY);
  };

  // Clear override on tab close (sessionStorage already handles this, but also
  // clear when storage event fires from another tab so they stay in sync).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const v = e.newValue;
        setViewAsState(
          v === "logged_out" || v === "unverified_user" || v === "verified_user" ? v : null
        );
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs }}>{children}</ViewAsContext.Provider>
  );
};

export const useViewAs = () => useContext(ViewAsContext);