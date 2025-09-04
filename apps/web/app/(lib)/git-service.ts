import simpleGit, { SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

interface CloneResult {
  localPath: string;
  cleanup: () => Promise<void>;
}

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async cloneRepository(repositoryUrl: string): Promise<CloneResult> {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'git-clone-'));
    const localPath = join(tempDir, 'repository');

    try {
      await this.git.clone(repositoryUrl, localPath, {
        '--depth': 1,
        '--single-branch': null,
      });

      const cleanup = async () => {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
          console.warn(`Failed to cleanup temporary directory ${tempDir}:`, error);
        }
      };

      return { localPath, cleanup };
    } catch (error) {
      // Cleanup on failure
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temporary directory ${tempDir}:`, cleanupError);
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to clone repository ${repositoryUrl}: ${error.message}`);
      }
      throw new Error(`Failed to clone repository ${repositoryUrl}: Unknown error`);
    }
  }

  async validateRepositoryUrl(repositoryUrl: string): Promise<boolean> {
    try {
      await this.git.listRemote([repositoryUrl]);
      return true;
    } catch (error) {
      return false;
    }
  }
}