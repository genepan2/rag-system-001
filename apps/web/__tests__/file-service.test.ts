import { FileService } from '../app/(lib)/file-service';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

describe('FileService', () => {
  let fileService: FileService;
  let testDir: string;

  beforeEach(async () => {
    fileService = new FileService();
    testDir = await fs.mkdtemp(join(tmpdir(), 'file-service-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error);
    }
  });

  describe('findMarkdownFiles', () => {
    it('should find markdown files in directory', async () => {
      // Create test files
      await fs.writeFile(join(testDir, 'test.md'), '# Test');
      await fs.writeFile(join(testDir, 'readme.markdown'), '# Readme');
      await fs.writeFile(join(testDir, 'other.txt'), 'Not markdown');

      const markdownFiles = await fileService.findMarkdownFiles(testDir);
      
      expect(markdownFiles).toHaveLength(2);
      expect(markdownFiles).toContain('test.md');
      expect(markdownFiles).toContain('readme.markdown');
      expect(markdownFiles).not.toContain('other.txt');
    });

    it('should find markdown files recursively in subdirectories', async () => {
      // Create subdirectory and files
      const subDir = join(testDir, 'subdirectory');
      await fs.mkdir(subDir);
      
      await fs.writeFile(join(testDir, 'root.md'), '# Root');
      await fs.writeFile(join(subDir, 'sub.md'), '# Sub');

      const markdownFiles = await fileService.findMarkdownFiles(testDir);
      
      expect(markdownFiles).toHaveLength(2);
      expect(markdownFiles).toContain('root.md');
      expect(markdownFiles).toContain('subdirectory/sub.md');
    });

    it('should return empty array for directory with no markdown files', async () => {
      await fs.writeFile(join(testDir, 'test.txt'), 'Not markdown');
      
      const markdownFiles = await fileService.findMarkdownFiles(testDir);
      
      expect(markdownFiles).toHaveLength(0);
    });

    it('should skip hidden directories', async () => {
      // Create .git directory with markdown file
      const gitDir = join(testDir, '.git');
      await fs.mkdir(gitDir);
      await fs.writeFile(join(gitDir, 'config.md'), '# Git config');
      await fs.writeFile(join(testDir, 'visible.md'), '# Visible');

      const markdownFiles = await fileService.findMarkdownFiles(testDir);
      
      expect(markdownFiles).toHaveLength(1);
      expect(markdownFiles).toContain('visible.md');
      expect(markdownFiles).not.toContain('.git/config.md');
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistentDir = join(testDir, 'nonexistent');
      
      await expect(fileService.findMarkdownFiles(nonExistentDir)).rejects.toThrow('Failed to scan directory');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const testFile = join(testDir, 'test.md');
      await fs.writeFile(testFile, '# Test');

      const exists = await fileService.fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const nonExistentFile = join(testDir, 'nonexistent.md');

      const exists = await fileService.fileExists(nonExistentFile);
      expect(exists).toBe(false);
    });
  });
});