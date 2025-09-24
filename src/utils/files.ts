// CODECTI Platform - File Utilities

export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileType(contentType: string): boolean {
  return Object.keys(ALLOWED_FILE_TYPES).includes(contentType);
}

export function getFileExtension(contentType: string): string {
  return ALLOWED_FILE_TYPES[contentType as keyof typeof ALLOWED_FILE_TYPES] || '';
}

export function validateFileSize(size: number): boolean {
  return size >= 0 && size <= MAX_FILE_SIZE;
}

export function generateFileName(originalName: string, projectId: number): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts.pop() || '' : '';
  return `project_${projectId}_${timestamp}_${random}.${extension}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return formatted + ' ' + sizes[i];
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
}