import { Home, Plus, Archive, MessageSquare, Settings } from "lucide-react";
import React from "react";

const mockWorkspaces = [
  {
    city: "Manama",
    name: "web-claude-interface",
    shortcut: "⌘1",
    lastActive: "5 hr"
  },
  {
    city: "Beirut",
    name: "slash-commands-feature",
    shortcut: "⌘2",
    lastActive: "5 hr"
  },
  {
    city: "Douala",
    name: "claude-web-terminal",
    shortcut: "⌘3",
    lastActive: "4 min",
    active: true
  }
];

function WorkspaceItem({ ws }: { ws: typeof mockWorkspaces[number] }) {
  return (
    <div
      className={`group rounded-sm px-3 py-2 hover:bg-accent cursor-pointer transition-all relative text-sidebar-foreground ${ws.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
      `}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex justify-between gap-2 items-center min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-semibold uppercase text-muted-foreground truncate">
              {ws.city}
            </span>
            <span className="text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[14px]">⌘</span>
              {ws.shortcut.replace("⌘", "")}
            </span>
          </div>
          <span className="text-xs font-mono uppercase text-muted-foreground flex-shrink-0">
            {ws.lastActive}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-base truncate font-sans">{ws.name}</span>
          <Archive className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="bg-sidebar flex flex-col h-screen w-64 border-r border-sidebar-border select-none">
      <div className="pt-8" />
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <button className="flex items-center gap-3 text-sidebar-muted-foreground hover:bg-accent rounded-sm w-full px-3 py-3 mb-4">
          <Home className="size-4" />
          <span className="text-base">Dashboard</span>
        </button>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold px-3 py-2 mb-1 text-sidebar-foreground truncate">
              open-ode
            </h4>
            <div className="space-y-1">
              {mockWorkspaces.slice(0, 2).map((ws) => (
                <WorkspaceItem key={ws.name} ws={ws} />
              ))}
              <button className="flex items-center gap-2 text-muted-foreground hover:bg-muted w-full rounded-lg px-3 py-2 h-10">
                <Plus className="h-4 w-4" />
                <span>New workspace</span>
              </button>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold px-3 py-2 mb-1 text-sidebar-foreground truncate">
              open-ode
            </h4>
            <div className="space-y-1">
              {mockWorkspaces.slice(2).map((ws) => (
                <WorkspaceItem key={ws.name} ws={ws} />
              ))}
              <button className="flex items-center gap-2 text-muted-foreground hover:bg-muted w-full rounded-lg px-3 py-2 h-10">
                <Plus className="h-4 w-4" />
                <span>New workspace</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="p-4 flex items-center gap-5 border-t border-sidebar-border">
        <button className="text-sidebar-muted-foreground hover:text-foreground flex items-center gap-2">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add repository</span>
          <span className="sm:hidden">Add</span>
        </button>
        <div className="ml-auto flex items-center gap-5">
          <Archive className="size-4 text-sidebar-muted-foreground hover:text-foreground cursor-pointer" />
          <MessageSquare className="size-4 text-sidebar-muted-foreground hover:text-foreground cursor-pointer" />
          <Settings className="size-4 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}