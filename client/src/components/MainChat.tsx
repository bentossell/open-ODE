import React from "react";
import { Hammer, ChevronDown, PanelRight } from "lucide-react";

export default function MainChat() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between bg-sidebar px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-4 text-base select-none">
          <button className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80">
            {/* workspace name */}
            <span className="font-medium">claude-web-terminal</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-2 py-1 rounded text-sidebar-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
            <Hammer className="size-4" />
          </button>
          <button className="px-2 py-1 border border-input-border rounded text-sidebar-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
            Open in <ChevronDown className="h-3 w-3 -ml-1" />
          </button>
          <button className="ml-1 p-0 h-4 w-4 inline-flex items-center justify-center" aria-label="Toggle right sidebar">
            <PanelRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </header>
      {/* Scrollable messages */}
      <main className="flex-1 overflow-auto p-4 space-y-4 bg-background">
        {/* Example system message */}
        <div className="flex justify-start">
          <div className="max-w-xl space-y-2">
            <p className="text-base">
              You're in the <strong>Douala</strong> workspace. This is a fresh copy of your codebase.
            </p>
            <p className="text-base">
              You're on a new branch <strong>claude-web-terminal</strong>. Once you start working, I'll rename the branch to be more descriptive.
            </p>
            <p className="text-base">What would you like me to do?</p>
          </div>
        </div>
        {/* Example user message */}
        <div className="flex justify-end">
          <div className="bg-highlight text-highlight-foreground p-3 rounded max-w-xl">
            <span>hi</span>
          </div>
        </div>
      </main>
      {/* Composer */}
      <div className="relative p-4 bg-background border-t border-border">
        <textarea
          className="w-full resize-none rounded-lg border border-border px-3 py-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="Ask Claude anything..."
        />
        <button
          className="absolute bottom-6 right-6 p-1 bg-muted text-muted-foreground rounded-full cursor-pointer hover:opacity-80"
          aria-label="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up size-4">
            <path d="m5 12 7-7 7 7"></path>
            <path d="M12 19V5"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}