export interface SlashCommand {
  id: string;
  shortcut: string; // e.g., "/hn"
  prompt: string;   // The full prompt to send to Claude
  description?: string;
  referenceFiles?: string[]; // Workspace files to reference
  urls?: string[]; // URLs to include in the prompt
  createdAt: Date;
  updatedAt: Date;
}

export interface SlashCommandInput {
  shortcut: string;
  prompt: string;
  description?: string;
  referenceFiles?: string[];
  urls?: string[];
}