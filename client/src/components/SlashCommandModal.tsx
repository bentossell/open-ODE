import React, { useState, useEffect } from 'react';
import { SlashCommand, SlashCommandInput } from '../types/slashCommand';
import './SlashCommandModal.css';

interface SlashCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (command: SlashCommandInput) => void;
  editingCommand?: SlashCommand;
}

export const SlashCommandModal: React.FC<SlashCommandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCommand
}) => {
  const [shortcut, setShortcut] = useState('');
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [newFile, setNewFile] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (editingCommand) {
      setShortcut(editingCommand.shortcut);
      setPrompt(editingCommand.prompt);
      setDescription(editingCommand.description || '');
      setReferenceFiles(editingCommand.referenceFiles || []);
      setUrls(editingCommand.urls || []);
    } else {
      resetForm();
    }
  }, [editingCommand]);

  const resetForm = () => {
    setShortcut('');
    setPrompt('');
    setDescription('');
    setReferenceFiles([]);
    setUrls([]);
    setNewFile('');
    setNewUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shortcut.startsWith('/')) {
      alert('Shortcut must start with /');
      return;
    }

    onSave({
      shortcut,
      prompt,
      description: description || undefined,
      referenceFiles: referenceFiles.length > 0 ? referenceFiles : undefined,
      urls: urls.length > 0 ? urls : undefined
    });

    resetForm();
    onClose();
  };

  const addFile = () => {
    if (newFile && !referenceFiles.includes(newFile)) {
      setReferenceFiles([...referenceFiles, newFile]);
      setNewFile('');
    }
  };

  const removeFile = (file: string) => {
    setReferenceFiles(referenceFiles.filter(f => f !== file));
  };

  const addUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setNewUrl('');
    }
  };

  const removeUrl = (url: string) => {
    setUrls(urls.filter(u => u !== url));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{editingCommand ? 'Edit' : 'Create'} Slash Command</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="shortcut">Shortcut</label>
            <input
              id="shortcut"
              type="text"
              value={shortcut}
              onChange={e => setShortcut(e.target.value)}
              placeholder="/hn"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Fetch the latest top posts on Hacker News for the last 24 hours..."
              required
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Get latest Hacker News posts"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Reference Files (optional)</label>
            <div className="input-with-button">
              <input
                type="text"
                value={newFile}
                onChange={e => setNewFile(e.target.value)}
                placeholder="path/to/file.ts"
                className="form-input"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFile())}
              />
              <button type="button" onClick={addFile} className="add-button">Add</button>
            </div>
            <div className="tag-list">
              {referenceFiles.map(file => (
                <span key={file} className="tag">
                  {file}
                  <button type="button" onClick={() => removeFile(file)} className="tag-remove">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>URLs (optional)</label>
            <div className="input-with-button">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="form-input"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              />
              <button type="button" onClick={addUrl} className="add-button">Add</button>
            </div>
            <div className="tag-list">
              {urls.map(url => (
                <span key={url} className="tag">
                  {url}
                  <button type="button" onClick={() => removeUrl(url)} className="tag-remove">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              {editingCommand ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};