import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.localAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    utils.invalidate();
    window.location.reload();
  }, [utils]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin" || user?.role === "superadmin",
      isLoading,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, error, logout, refetch],
  );
}
