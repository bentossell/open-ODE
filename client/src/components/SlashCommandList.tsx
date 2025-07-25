import React from 'react';
import { SlashCommand } from '../types/slashCommand';
import './SlashCommandList.css';

interface SlashCommandListProps {
  commands: SlashCommand[];
  onEdit: (command: SlashCommand) => void;
  onDelete: (shortcut: string) => void;
  onClose: () => void;
}

export const SlashCommandList: React.FC<SlashCommandListProps> = ({
  commands,
  onEdit,
  onDelete,
  onClose
}) => {
  return (
    <div className="command-list-overlay" onClick={onClose}>
      <div className="command-list-content" onClick={e => e.stopPropagation()}>
        <div className="command-list-header">
          <h2>Slash Commands</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {commands.length === 0 ? (
          <div className="empty-state">
            <p>No slash commands created yet.</p>
            <p>Click "New Command" to create your first one!</p>
          </div>
        ) : (
          <div className="commands-grid">
            {commands.map(command => (
              <div key={command.id} className="command-card">
                <div className="command-header">
                  <h3>{command.shortcut}</h3>
                  <div className="command-actions">
                    <button
                      className="edit-button"
                      onClick={() => onEdit(command)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => {
                        if (window.confirm(`Delete ${command.shortcut}?`)) {
                          onDelete(command.shortcut);
                        }
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {command.description && (
                  <p className="command-description">{command.description}</p>
                )}
                
                <div className="command-prompt">{command.prompt}</div>
                
                <div className="command-metadata">
                  {command.referenceFiles && command.referenceFiles.length > 0 && (
                    <div className="metadata-item">
                      <span className="metadata-label">Files:</span>
                      <span className="metadata-value">{command.referenceFiles.length}</span>
                    </div>
                  )}
                  {command.urls && command.urls.length > 0 && (
                    <div className="metadata-item">
                      <span className="metadata-label">URLs:</span>
                      <span className="metadata-value">{command.urls.length}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};