// CODECTI Platform - File Utils Unit Tests

import { describe, it, expect } from 'vitest';
import { 
  validateFileType, 
  validateFileSize, 
  getFileExtension, 
  generateFileName, 
  formatFileSize, 
  sanitizeFileName,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE 
} from '../../src/utils/files';

describe('File Utilities', () => {
  describe('File Type Validation', () => {
    it('should accept PDF files', () => {
      expect(validateFileType('application/pdf')).toBe(true);
    });

    it('should accept DOCX files', () => {
      expect(validateFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('should accept DOC files', () => {
      expect(validateFileType('application/msword')).toBe(true);
    });

    it('should reject invalid file types', () => {
      expect(validateFileType('image/jpeg')).toBe(false);
      expect(validateFileType('text/plain')).toBe(false);
      expect(validateFileType('application/json')).toBe(false);
      expect(validateFileType('')).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under size limit', () => {
      expect(validateFileSize(1024)).toBe(true); // 1KB
      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
    });

    it('should accept files at exact size limit', () => {
      expect(validateFileSize(MAX_FILE_SIZE)).toBe(true);
    });

    it('should reject files over size limit', () => {
      expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
      expect(validateFileSize(15 * 1024 * 1024)).toBe(false); // 15MB
    });

    it('should handle zero size files', () => {
      expect(validateFileSize(0)).toBe(true);
    });

    it('should handle negative sizes', () => {
      expect(validateFileSize(-1)).toBe(false);
    });
  });

  describe('File Extension Extraction', () => {
    it('should return correct extensions for valid types', () => {
      expect(getFileExtension('application/pdf')).toBe('.pdf');
      expect(getFileExtension('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('.docx');
      expect(getFileExtension('application/msword')).toBe('.doc');
    });

    it('should return empty string for invalid types', () => {
      expect(getFileExtension('image/jpeg')).toBe('');
      expect(getFileExtension('text/plain')).toBe('');
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('File Name Generation', () => {
    it('should generate unique filenames with project ID', () => {
      const originalName = 'document.pdf';
      const projectId = 123;
      
      const fileName1 = generateFileName(originalName, projectId);
      const fileName2 = generateFileName(originalName, projectId);
      
      expect(fileName1).not.toBe(fileName2);
      expect(fileName1).toMatch(/^project_123_\d+_\d+\.pdf$/);
      expect(fileName2).toMatch(/^project_123_\d+_\d+\.pdf$/);
    });

    it('should preserve file extension', () => {
      const fileName1 = generateFileName('test.pdf', 1);
      const fileName2 = generateFileName('test.docx', 1);
      const fileName3 = generateFileName('test.doc', 1);
      
      expect(fileName1).toMatch(/\.pdf$/);
      expect(fileName2).toMatch(/\.docx$/);
      expect(fileName3).toMatch(/\.doc$/);
    });

    it('should handle files without extension', () => {
      const fileName = generateFileName('document', 1);
      expect(fileName).toMatch(/^project_1_\d+_\d+\.$/);
    });

    it('should handle different project IDs', () => {
      const fileName1 = generateFileName('test.pdf', 123);
      const fileName2 = generateFileName('test.pdf', 456);
      
      expect(fileName1).toMatch(/^project_123_\d+_\d+/);
      expect(fileName2).toMatch(/^project_456_\d+_\d+/);
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should handle decimal places correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5KB
      expect(formatFileSize(1638)).toBe('1.6 KB'); // 1.599KB rounded
    });
  });

  describe('File Name Sanitization', () => {
    it('should sanitize special characters', () => {
      expect(sanitizeFileName('file with spaces.pdf')).toBe('file_with_spaces.pdf');
      expect(sanitizeFileName('file@#$%^&*().pdf')).toBe('file_.pdf');
      expect(sanitizeFileName('file/with\\slashes.pdf')).toBe('file_with_slashes.pdf');
    });

    it('should preserve allowed characters', () => {
      expect(sanitizeFileName('file-name_123.pdf')).toBe('file-name_123.pdf');
      expect(sanitizeFileName('MyDocument2024.docx')).toBe('mydocument2024.docx');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFileName('FILE.PDF')).toBe('file.pdf');
      expect(sanitizeFileName('MyDocument.DOCX')).toBe('mydocument.docx');
    });

    it('should handle multiple consecutive special characters', () => {
      expect(sanitizeFileName('file   with   spaces.pdf')).toBe('file_with_spaces.pdf');
      expect(sanitizeFileName('file@@@test.pdf')).toBe('file_test.pdf');
    });

    it('should handle empty or minimal input', () => {
      expect(sanitizeFileName('')).toBe('');
      expect(sanitizeFileName('.')).toBe('.');
      expect(sanitizeFileName('.pdf')).toBe('.pdf');
    });
  });

  describe('Constants', () => {
    it('should have correct allowed file types', () => {
      expect(ALLOWED_FILE_TYPES).toHaveProperty('application/pdf');
      expect(ALLOWED_FILE_TYPES).toHaveProperty('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(ALLOWED_FILE_TYPES).toHaveProperty('application/msword');
      
      expect(ALLOWED_FILE_TYPES['application/pdf']).toBe('.pdf');
      expect(ALLOWED_FILE_TYPES['application/vnd.openxmlformats-officedocument.wordprocessingml.document']).toBe('.docx');
      expect(ALLOWED_FILE_TYPES['application/msword']).toBe('.doc');
    });

    it('should have correct max file size', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });
  });
});