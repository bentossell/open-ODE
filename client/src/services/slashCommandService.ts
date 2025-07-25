import { SlashCommand, SlashCommandInput } from '../types/slashCommand';

const STORAGE_KEY = 'claude-slash-commands';

export class SlashCommandService {
  private commands: Map<string, SlashCommand> = new Map();

  constructor() {
    this.loadFromStorage();
    
    // Add example command if none exist
    if (this.commands.size === 0) {
      this.createCommand({
        shortcut: '/hn',
        prompt: 'Fetch the latest top posts on Hacker News for the last 24 hours, return them in a list in markdown format and make sure that the titles are hyperlinked to the destination URL and the comments are linked to the Hacker News thread.',
        description: 'Get latest Hacker News top posts',
        urls: ['https://news.ycombinator.com']
      });
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const commands: SlashCommand[] = JSON.parse(stored);
        commands.forEach(cmd => {
          // Ensure dates are Date objects
          cmd.createdAt = new Date(cmd.createdAt);
          cmd.updatedAt = new Date(cmd.updatedAt);
          this.commands.set(cmd.shortcut, cmd);
        });
      } catch (error) {
        console.error('Failed to load slash commands:', error);
      }
    }
  }

  private saveToStorage(): void {
    const commands = Array.from(this.commands.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  }

  public createCommand(input: SlashCommandInput): SlashCommand {
    const now = new Date();
    const command: SlashCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      createdAt: now,
      updatedAt: now
    };

    this.commands.set(command.shortcut, command);
    this.saveToStorage();
    return command;
  }

  public updateCommand(shortcut: string, input: Partial<SlashCommandInput>): SlashCommand | null {
    const existing = this.commands.get(shortcut);
    if (!existing) return null;

    const updated: SlashCommand = {
      ...existing,
      ...input,
      updatedAt: new Date()
    };

    // If shortcut changed, delete old entry
    if (input.shortcut && input.shortcut !== shortcut) {
      this.commands.delete(shortcut);
    }

    this.commands.set(updated.shortcut, updated);
    this.saveToStorage();
    return updated;
  }

  public deleteCommand(shortcut: string): boolean {
    const deleted = this.commands.delete(shortcut);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public getCommand(shortcut: string): SlashCommand | undefined {
    return this.commands.get(shortcut);
  }

  public getAllCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  public hasCommand(shortcut: string): boolean {
    return this.commands.has(shortcut);
  }

  public expandCommand(input: string): string | null {
    // Check if input starts with a known slash command
    const parts = input.split(' ');
    const shortcut = parts[0];
    
    const command = this.getCommand(shortcut);
    if (!command) return null;

    // Build the expanded prompt
    let expandedPrompt = command.prompt;

    // Add file references if any
    if (command.referenceFiles && command.referenceFiles.length > 0) {
      expandedPrompt = `Please reference these files: ${command.referenceFiles.join(', ')}\n\n${expandedPrompt}`;
    }

    // Add URL references if any
    if (command.urls && command.urls.length > 0) {
      expandedPrompt = `${expandedPrompt}\n\nUse these URLs: ${command.urls.join(', ')}`;
    }

    // If there are additional arguments after the slash command, append them
    if (parts.length > 1) {
      const additionalArgs = parts.slice(1).join(' ');
      expandedPrompt = `${expandedPrompt}\n\nAdditional context: ${additionalArgs}`;
    }

    return expandedPrompt;
  }
}

// Export singleton instance
export const slashCommandService = new SlashCommandService();