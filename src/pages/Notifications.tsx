import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markRead.mutate("all")}>
            <CheckCheck className="h-4 w-4 mr-1" />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <Badge variant="default" className="text-[10px] h-4">New</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
