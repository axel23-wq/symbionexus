'use client';

import { useState, useRef } from 'react';
import styles from './FileUploadZone.module.css';

interface FileItem {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  progress?: number;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: FileItem[]) => void;
  maxSize?: number; // MB
  maxFiles?: number;
}

const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/mpeg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

function getFileType(mimeType: string): FileItem['type'] {
  if (SUPPORTED_TYPES.image.includes(mimeType)) return 'image';
  if (SUPPORTED_TYPES.video.includes(mimeType)) return 'video';
  if (SUPPORTED_TYPES.audio.includes(mimeType)) return 'audio';
  if (SUPPORTED_TYPES.document.includes(mimeType)) return 'document';
  return 'other';
}

export default function FileUploadZone({ onFilesSelected, maxSize = 100, maxFiles = 10 }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];

    Array.from(fileList).forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds max size of ${maxSize}MB`);
        return;
      }

      // Check max files
      if (files.length + newFiles.length >= maxFiles) {
        console.warn(`Max files limit (${maxFiles}) reached`);
        return;
      }

      const fileType = getFileType(file.type);
      const fileItem: FileItem = { file, type: fileType };

      // Generate preview for images and videos
      if (fileType === 'image' || fileType === 'video') {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileItem.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileItem);
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const getFileIcon = (type: FileItem['type']) => {
    const icons: { [key: string]: string } = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      document: '📄',
      other: '📎',
    };
    return icons[type] || '📎';
  };

  return (
    <div className={styles['upload-zone']}>
      <div
        className={`${styles['drop-area']} ${isDragging ? styles['dragging'] : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles['upload-icon']}>📤</div>
        <p className={styles['upload-text']}>
          Drag & drop files here or <button onClick={() => inputRef.current?.click()} className={styles['click-btn']}>click to select</button>
        </p>
        <p className={styles['upload-hint']}>
          Images, videos, audio, documents (max {maxSize}MB, {maxFiles} files)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />
      </div>

      {files.length > 0 && (
        <div className={styles['file-list']}>
          <div className={styles['file-count']}>
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </div>
          <div className={styles['file-grid']}>
            {files.map((fileItem, idx) => (
              <div key={idx} className={styles['file-card']}>
                <div className={styles['file-preview-container']}>
                  {fileItem.preview ? (
                    <>
                      {fileItem.type === 'image' && (
                        <img src={fileItem.preview} alt={fileItem.file.name} className={styles['file-preview']} />
                      )}
                      {fileItem.type === 'video' && (
                        <video src={fileItem.preview} className={styles['file-preview']} />
                      )}
                    </>
                  ) : (
                    <div className={styles['file-icon']}>{getFileIcon(fileItem.type)}</div>
                  )}
                  <button
                    className={styles['remove-btn']}
                    onClick={() => removeFile(idx)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
                <div className={styles['file-info']}>
                  <p className={styles['file-name']} title={fileItem.file.name}>
                    {fileItem.file.name.substring(0, 20)}...
                  </p>
                  <p className={styles['file-size']}>
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
