'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, Video, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { validateMultipleMediaForContentType, getAcceptAttributeForContentType, getMediaTypeDescription, type ContentType } from '@/utils/mediaValidation';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onUpload: (files: File[], prompt?: string) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
  contentType?: ContentType; // New prop for content type validation
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
}

export default function FileUpload({
  onFilesSelected,
  onUpload,
  accept,
  multiple = true,
  maxFiles = 10,
  maxSize = 50, // 50MB default
  disabled = false,
  isUploading = false,
  className = '',
  contentType,
}: FileUploadProps) {
  // Use content type specific accept attribute if contentType is provided
  const finalAccept = contentType ? getAcceptAttributeForContentType(contentType) : (accept || 'image/*,video/*');
  
  // Ensure finalAccept is always a string
  const safeAccept = finalAccept || 'image/*,video/*';
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [prompt, setPrompt] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // If contentType is provided, use content type validation
    if (contentType) {
      const validation = validateMultipleMediaForContentType([file], contentType);
      if (!validation.isValid) {
        return validation.errors[0] || `File ${file.name} is not valid for ${contentType} content.`;
      }
      return null;
    }

    // Fallback to original validation
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }

    // Check file type
    const acceptedTypes = safeAccept.split(',').map(type => type.trim());
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isAccepted = acceptedTypes.some(acceptedType => {
      if (acceptedType.endsWith('/*')) {
        const baseType = acceptedType.replace('/*', '');
        return fileType.startsWith(baseType);
      }
      return fileType === acceptedType || fileExtension === acceptedType;
    });

    if (!isAccepted) {
      return `File ${file.name} is not a supported format.`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: FilePreview[] = [];
    const errors: string[] = [];

    // Check if we exceed max files
    if (selectedFiles.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed.`);
    }

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        const preview: FilePreview = {
          file,
          id: Math.random().toString(36).substr(2, 9),
        };

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.preview = e.target?.result as string;
            setSelectedFiles(prev => 
              prev.map(f => f.id === preview.id ? preview : f)
            );
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(preview);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles.map(f => f.file));
    }
  }, [selectedFiles, maxFiles, maxSize, accept, onFilesSelected, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, isUploading, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    const newFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles.map(f => f.file));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await onUpload(selectedFiles.map(f => f.file), prompt.trim() || undefined);
      setSelectedFiles([]);
      setPrompt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Content Type Description */}
      {contentType && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span>{getMediaTypeDescription(contentType)}</span>
        </div>
      )}
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-[#ef5a29] bg-[#fef7f5]'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={safeAccept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <div className="space-y-2">
          <Upload className={`h-8 w-8 mx-auto ${dragActive ? 'text-[#ef5a29]' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              {safeAccept.includes('image') && safeAccept.includes('video') 
                ? 'Images and videos up to ' + maxSize + 'MB'
                : safeAccept.includes('image')
                ? 'Images up to ' + maxSize + 'MB'
                : safeAccept.includes('video')
                ? 'Videos up to ' + maxSize + 'MB'
                : 'Files up to ' + maxSize + 'MB'
              }
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-gray-500">
                Maximum {maxFiles} files
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Files ({selectedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {selectedFiles.map((filePreview) => (
              <div
                key={filePreview.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(filePreview.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(filePreview.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(filePreview.id)}
                  disabled={disabled || isUploading}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="upload-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              AI Generation Prompt (Optional)
            </label>
            <textarea
              id="upload-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:border-transparent"
              placeholder="Describe what you want to generate or modify in these files..."
              disabled={disabled || isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This prompt will be used for AI-powered media generation or enhancement.
            </p>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={disabled || isUploading}
            className="w-full bg-[#ef5a29] text-white hover:bg-[#d4491f] disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
