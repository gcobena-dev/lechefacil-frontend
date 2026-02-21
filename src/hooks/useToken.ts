import { useEffect, useState } from "react";
import { getToken } from "@/services/config";

/**
 * Reactive token hook. Re-renders on localStorage changes and explicit token events.
 */
export function useToken(): string | null {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lf_token") {
        setTokenState(getToken());
      }
    };
    const onCustom = () => setTokenState(getToken());

    window.addEventListener("storage", onStorage);
    window.addEventListener("lf_token_changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lf_token_changed", onCustom as EventListener);
    };
  }, []);

  return token;
}
