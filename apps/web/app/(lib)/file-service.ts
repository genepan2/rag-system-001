import { promises as fs } from 'fs';
import { join, extname, relative } from 'path';

export class FileService {
  async findMarkdownFiles(directoryPath: string): Promise<string[]> {
    const markdownFiles: string[] = [];
    
    try {
      await this.walkDirectory(directoryPath, directoryPath, markdownFiles);
      return markdownFiles.sort();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to scan directory ${directoryPath}: ${error.message}`);
      }
      throw new Error(`Failed to scan directory ${directoryPath}: Unknown error`);
    }
  }

  private async walkDirectory(
    currentPath: string,
    rootPath: string,
    markdownFiles: string[]
  ): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip .git directories and other hidden directories
        if (!entry.name.startsWith('.')) {
          await this.walkDirectory(fullPath, rootPath, markdownFiles);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (ext === '.md' || ext === '.markdown') {
          // Store relative path from repository root
          const relativePath = relative(rootPath, fullPath);
          markdownFiles.push(relativePath);
        }
      }
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}