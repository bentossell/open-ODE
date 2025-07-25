# Claude Code Commands & Shortcuts Guide

A comprehensive guide to all commands, shortcuts, and interactive features available in Claude Code.

## Table of Contents
- [Slash Commands](#slash-commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Interactive Features](#interactive-features)
- [Vim Mode](#vim-mode)
- [Plan Mode](#plan-mode)
- [Memory System](#memory-system)

## Slash Commands

Slash commands provide quick access to Claude Code features. Type these at the beginning of your message:

### Project Management
- **`/init`** - Initialize project with CLAUDE.md guide
  - Creates a memory file to track project context
  - Helps Claude understand your codebase structure
  
- **`/add-dir`** - Add additional working directories
  - Expand Claude's access to multiple project folders
  - Useful for monorepos or related projects

- **`/memory`** - Edit CLAUDE.md memory files
  - View and modify project-specific context
  - Update project goals and current state

### AI & Model Control
- **`/model`** - Select or change the AI model
  - Switch between available Claude models
  - Choose based on speed vs capability needs

- **`/agents`** - Manage custom AI sub-agents for specialized tasks
  - Create task-specific AI assistants
  - Delegate complex operations

### Session Management
- **`/clear`** - Clear conversation history
  - Start fresh while keeping project context
  - Useful when conversation gets too long

- **`/compact [instructions]`** - Compact conversation with optional focus
  - Reduce conversation size while preserving key context
  - Add instructions to focus on specific aspects

### Authentication & Account
- **`/login`** - Switch Anthropic accounts
  - Change between different API keys
  - Switch team accounts

- **`/logout`** - Sign out from your Anthropic account
  - Disconnect current session
  - Clear authentication

- **`/status`** - View account and system statuses
  - Check API usage and limits
  - View system health

### Development Tools
- **`/review`** - Request code review
  - Get AI-powered code review
  - Identify potential issues and improvements

- **`/pr_comments`** - View pull request comments
  - Access GitHub PR feedback
  - Integrate with code review workflow

- **`/vim`** - Enter vim mode for alternating insert and command modes
  - Use familiar vim keybindings
  - Efficient text navigation and editing

### Configuration & Setup
- **`/config`** - View/modify configuration
  - Adjust Claude Code settings
  - Customize behavior

- **`/permissions`** - View or update permissions
  - Control file access
  - Manage security settings

- **`/terminal-setup`** - Install Shift+Enter key binding for newlines
  - Available for iTerm2 and VSCode
  - Enables multiline input

### MCP (Model Context Protocol)
- **`/mcp`** - Manage MCP server connections and OAuth authentication
  - Connect to external tools and services
  - Manage integrations

### Utilities
- **`/cost`** - Show token usage statistics
  - Track API usage
  - Monitor costs

- **`/doctor`** - Checks the health of your Claude Code installation
  - Diagnose issues
  - Verify setup

- **`/help`** - Get usage help
  - Quick reference
  - Command documentation

- **`/bug`** - Report bugs (sends conversation to Anthropic)
  - Help improve Claude Code
  - Report issues directly

## Keyboard Shortcuts

### General Controls
- **`Ctrl+C`** - Cancel current input or generation
  - Stop Claude mid-response
  - Cancel current operation

- **`Ctrl+D`** - Exit Claude Code session
  - Cleanly terminate session
  - Save state before exit

- **`Ctrl+L`** - Clear terminal screen
  - Clean up visual clutter
  - Keep conversation history

- **`Up/Down arrows`** - Navigate command history
  - Recall previous commands
  - Quick re-execution

- **`Esc` + `Esc`** - Edit previous message
  - Correct mistakes
  - Refine questions

### Multiline Input
For entering code blocks or long messages:

- **`\` + `Enter`** - Quick escape (works in all terminals)
- **`Option+Enter`** - macOS default
- **`Shift+Enter`** - After running `/terminal-setup`
- **Direct paste** - Automatically handles multiline content

### Search
- **`Ctrl+R`** - Reverse search history (if terminal supports)
  - Find previous commands
  - Quick command lookup

## Interactive Features

### Plan Mode
Claude can enter "plan mode" for complex tasks:
- Automatically triggered for multi-step operations
- Shows structured approach before execution
- Review and approve plans before proceeding

### Interrupts
- **`Esc` key** - Interrupt Claude during generation
  - Stop verbose outputs
  - Redirect conversation

- **`Ctrl+C`** - Force stop current operation
  - Emergency stop
  - Cancel stuck processes

### Quick Commands
- **`#` at start** - Memory shortcut
  - Quick access to memory files
  - Example: `#project-status`

- **`/` at start** - Slash command prefix
  - Access all slash commands
  - Tab completion available

## Vim Mode

Activate with `/vim` command. Provides two modes:

### NORMAL Mode (Navigation)
**Movement:**
- `h/j/k/l` - Left/Down/Up/Right
- `w` - Next word
- `e` - End of word
- `b` - Previous word
- `0` - Start of line
- `$` - End of line
- `^` - First non-blank character
- `gg` - Start of document
- `G` - End of document

**Editing:**
- `i` - Enter INSERT mode
- `a` - Append (enter INSERT after cursor)
- `I` - Insert at line beginning
- `A` - Append at line end
- `o` - Open new line below
- `O` - Open new line above

**Deletion:**
- `x` - Delete character
- `dd` - Delete line
- `D` - Delete to end of line
- `dw` - Delete word

**Other:**
- `u` - Undo
- `.` - Repeat last change
- `v` - Visual mode (selection)

### INSERT Mode
- Type normally
- `Esc` - Return to NORMAL mode

## Plan Mode

Claude automatically enters plan mode for complex tasks:

### When Plan Mode Activates:
- Multiple file operations
- Complex refactoring
- Multi-step implementations
- Architecture decisions

### Plan Mode Features:
1. **Structured Planning** - Step-by-step breakdown
2. **Review Before Execute** - Approve or modify plans
3. **Progress Tracking** - See completed steps
4. **Interruption Safe** - Can pause and resume

### Controlling Plan Mode:
- Let Claude finish planning
- Review proposed steps
- Approve with confirmation
- Or interrupt with `Esc` to modify

## Memory System

Claude uses memory files to maintain context:

### CLAUDE.md
- Main project memory file
- Created with `/init`
- Contains:
  - Project overview
  - Current tasks
  - Important context
  - Technical decisions

### Memory Shortcuts
- `#memory` - Quick access to memory content
- `#<section>` - Jump to specific sections
- `/memory` - Edit memory files

### Best Practices:
1. Update memory after major changes
2. Keep task lists current
3. Document key decisions
4. Remove outdated information

## Tips & Tricks

### Efficient Workflow
1. Use `/init` at project start
2. Keep CLAUDE.md updated
3. Use `/compact` when conversations get long
4. Leverage vim mode for quick edits
5. Set up `Shift+Enter` for easier multiline input

### Command Combinations
- `/clear` + `/memory` - Fresh start with context
- `/model` + `/cost` - Optimize for budget
- `/review` + `/pr_comments` - Complete code review

### Troubleshooting
- Run `/doctor` for health check
- Use `/status` to verify API limits
- `/bug` to report issues
- `/config` to check settings

---

**Note**: This guide covers Claude Code CLI features. Some features may vary based on your terminal, OS, and Claude Code version. Run `/help` for the most up-to-date information specific to your installation.