import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sandboxDemo";

interface SandboxState {
  sandboxDemoActive: boolean;
  activateSandboxDemo: () => void;
  deactivateSandboxDemo: () => void;
}

const SandboxContext = createContext<SandboxState | null>(null);

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [sandboxDemoActive, setSandboxDemoActive] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const activateSandboxDemo = useCallback(() => {
    setSandboxDemoActive(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage unavailable — state still works in-memory
    }
  }, []);

  const deactivateSandboxDemo = useCallback(() => {
    setSandboxDemoActive(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  return (
    <SandboxContext.Provider
      value={{ sandboxDemoActive, activateSandboxDemo, deactivateSandboxDemo }}
    >
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandboxDemo() {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("useSandboxDemo must be used within a SandboxProvider");
  }
  return context;
}
