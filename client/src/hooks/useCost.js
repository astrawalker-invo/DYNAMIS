import { useEffect, useState } from "react";
import { realApi } from "../api/axios";
import { useAuthStore } from "../store/authStore";

export function useCost(homeId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!homeId || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await realApi.get(`/api/home/${homeId}/cost`);
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeId, token]);

  return { loading, error };
}
