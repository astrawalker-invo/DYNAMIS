import { useAuthStore } from "../store/authStore";

export function useHomeId() {
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  if (isDemo) return user?.demo_home_id || null;
  return user?.home_id || null;
}
