import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "cancelled"
  | "expired"
  | "suspended"
  | null;

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      setLoading(true);
      if (!supabase || !user) {
        if (mounted) {
          setStatus(null);
          setLoading(false);
        }
        return;
      }
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mounted) {
          setStatus((data?.status as SubscriptionStatus) ?? null);
        }
      } catch {
        if (mounted) setStatus(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [user]);

  const isPro = status === "active" || status === "trialing";
  return { status, isPro, loading };
}
