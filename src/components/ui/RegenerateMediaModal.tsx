'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface RegenerateMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (prompt: string) => Promise<void>;
  currentPrompt?: string;
  mediaType: 'image' | 'video';
  mediaFileName: string;
}

export default function RegenerateMediaModal({
  isOpen,
  onClose,
  onRegenerate,
  currentPrompt = '',
  mediaType,
  mediaFileName
}: RegenerateMediaModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for media generation');
      return;
    }

    try {
      setIsRegenerating(true);
      await onRegenerate(prompt.trim());
      onClose();
    } catch (error) {
      console.error('Failed to regenerate media:', error);
      alert('Failed to regenerate media. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleClose = () => {
    if (!isRegenerating) {
      setPrompt(currentPrompt);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#fef7f5] rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#ef5a29]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Re-generate Media</h2>
              <p className="text-sm text-gray-600">
                Customize the prompt to generate new {mediaType} content
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isRegenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Media Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Current Media</h3>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#fef7f5] rounded-full flex items-center justify-center">
                {mediaType === 'image' ? (
                  <svg className="h-4 w-4 text-[#ef5a29]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-[#ef5a29]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 font-medium">{mediaFileName}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {mediaType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              AI Generation Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:border-transparent"
              placeholder={`Enter a detailed prompt for generating a new ${mediaType}...`}
              disabled={isRegenerating}
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about the content, style, mood, and visual elements you want in the new {mediaType}.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better results:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Describe the main subject or scene clearly</li>
              <li>• Specify the visual style (e.g., "modern", "vintage", "minimalist")</li>
              <li>• Include mood and atmosphere (e.g., "bright and cheerful", "mysterious")</li>
              <li>• Mention key visual elements to include</li>
              <li>• Consider the target audience and brand tone</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !prompt.trim()}
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f] disabled:opacity-50"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Re-generate {mediaType === 'image' ? 'Image' : 'Video'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
