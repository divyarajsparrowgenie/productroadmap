import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AppNotification[];
    },
    refetchInterval: 30000, // poll every 30s
  });
}

export function useUnreadCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n) => !n.read).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[] | "all") => {
      if (ids === "all") {
        const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notifications").update({ read: true }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: { user_id: string; title: string; body?: string; link?: string }) => {
      const { error } = await supabase.from("notifications").insert(n);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
