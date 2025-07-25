import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '../lib/supabase';

// Command buttons configuration
const COMMANDS = [
  { id: 'help', label: 'Help', description: 'Show Claude Code help' },
  { id: 'list_files', label: 'List Files', description: 'Show all files in current directory' },
  { id: 'git_status', label: 'Git Status', description: 'Check git repository status' },
  { id: 'show_model', label: 'Show Model', description: 'Display current AI model' },
  { id: 'current_dir', label: 'Current Directory', description: 'Show working directory' },
  { id: 'test', label: 'Test', description: 'Run a test command' },
];

export const SimpleCommandUI: React.FC = () => {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const runCommand = async (commandId: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Make API call
      const response = await fetch('/api/run-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ command: commandId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run command');
      }

      setOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Simple Command Interface</h2>
      
      {/* Command Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {COMMANDS.map(cmd => (
          <Button
            key={cmd.id}
            onClick={() => runCommand(cmd.id)}
            disabled={loading}
            variant="outline"
            className="flex flex-col items-start p-4 h-auto"
          >
            <span className="font-semibold">{cmd.label}</span>
            <span className="text-xs text-muted-foreground">{cmd.description}</span>
          </Button>
        ))}
      </div>

      {/* Status */}
      {loading && (
        <Badge variant="default" className="mb-4">
          Running command...
        </Badge>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Output Display */}
      {output && (
        <div className="bg-muted rounded-md p-4">
          <h3 className="text-sm font-semibold mb-2">Output:</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};
