import { GitService } from '../app/(lib)/git-service';

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    gitService = new GitService();
  });

  describe('validateRepositoryUrl', () => {
    it('should return false for invalid repository URL', async () => {
      const isValid = await gitService.validateRepositoryUrl('invalid-url');
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent repository', async () => {
      const isValid = await gitService.validateRepositoryUrl('https://github.com/nonexistent/repository');
      expect(isValid).toBe(false);
    });

    // Note: This test requires network access and may be slow
    it.skip('should return true for valid public repository', async () => {
      const isValid = await gitService.validateRepositoryUrl('https://github.com/octocat/Hello-World');
      expect(isValid).toBe(true);
    }, 10000);
  });

  describe('cloneRepository', () => {
    it('should throw error for invalid repository URL', async () => {
      await expect(gitService.cloneRepository('invalid-url')).rejects.toThrow('Failed to clone repository');
    }, 10000);

    // Note: This test requires network access and may be slow
    it.skip('should clone valid repository and provide cleanup function', async () => {
      const result = await gitService.cloneRepository('https://github.com/octocat/Hello-World');
      
      expect(result.localPath).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe('function');

      // Cleanup
      await result.cleanup();
    }, 30000);
  });
});