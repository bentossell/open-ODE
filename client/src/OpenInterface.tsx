import React from 'react';
import { Home, Plus, FolderPlus, Archive, MessageSquare, Settings, PanelRight } from 'lucide-react';

export default function OpenInterface() {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <aside className="w-60 bg-white border-r flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className="text-xs uppercase text-gray-500 px-2">Workspaces</div>
          <div className="space-y-1">
            <div className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">web-claude-interface</div>
            <div className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">slash-commands-feature</div>
            <div className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer bg-gray-200">claude-web-terminal</div>
          </div>
          <button className="flex items-center gap-1 text-sm text-gray-600 mt-2 hover:text-black">
            <Plus className="w-4 h-4" /> New workspace
          </button>
        </div>
        <div className="p-4 flex items-center justify-between border-t text-gray-500 text-sm">
          <button className="flex items-center gap-2 hover:text-black">
            <FolderPlus className="w-4 h-4" /> Add repository
          </button>
          <div className="flex items-center gap-4">
            <Archive className="w-4 h-4 hover:text-black" />
            <MessageSquare className="w-4 h-4 hover:text-black" />
            <Settings className="w-4 h-4 hover:text-black" />
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-white p-4 border-b">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">claude-web-terminal</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <button className="hover:text-black"><PanelRight className="w-4 h-4" /></button>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            <div>You're in the <strong>Douala</strong> workspace. This is a fresh copy of your codebase.</div>
            <div>You're on a new branch <strong>claude-web-terminal</strong>. Once you start working, I'll rename the branch to be more descriptive.</div>
            <div>What would you like me to do?</div>
            <div className="flex justify-end"><div className="bg-yellow-100 text-yellow-800 p-2 rounded">hi</div></div>
            <div>I'll rename the branch to something more descriptive. Based on the CLAUDE.md file, this project is building a web-accessible terminal interface for Claude Code. Let me rename the branch accordingly.</div>
            <div className="text-gray-500 italic">[placeholder for more conversation]</div>
          </div>
          <aside className="w-64 border-l flex flex-col">
            <div className="flex-1 flex items-center justify-center text-gray-500">No todos yet</div>
            <div className="border-t p-4 text-sm hover:bg-gray-100 cursor-pointer">Terminal</div>
          </aside>
        </div>
        <div className="p-4 border-t bg-white">
          <textarea className="w-full border rounded p-2 h-24" placeholder="Ask Claude anything..."></textarea>
        </div>
      </main>
    </div>
  );
}
