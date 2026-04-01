import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell, MessageSquare, Calendar, FileText, DollarSign,
  Users, AlertTriangle, Star, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "whatsapp" | "appointment" | "budget" | "financial" | "lead" | "cadence" | "nps";
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const ICONS: Record<string, typeof Bell> = {
  whatsapp: MessageSquare,
  appointment: Calendar,
  budget: FileText,
  financial: DollarSign,
  lead: Users,
  cadence: AlertTriangle,
  nps: Star,
};

const ICON_COLORS: Record<string, string> = {
  whatsapp: "text-success",
  appointment: "text-info",
  budget: "text-primary",
  financial: "text-warning",
  lead: "text-info",
  cadence: "text-warning",
  nps: "text-destructive",
};

const initialNotifications: Notification[] = [];

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notificacoes</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={markAllRead}>
              <Check className="mr-1 h-3 w-3" />Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(n => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent", !n.read && "bg-primary/5")}>
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted", ICON_COLORS[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                      {!n.read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
