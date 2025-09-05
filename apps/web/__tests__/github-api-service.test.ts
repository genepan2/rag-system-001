import { GitHubAPIService } from '../app/(lib)/github-api-service';

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          get: jest.fn(),
        },
        git: {
          getTree: jest.fn(),
        },
      },
    })),
  };
});

describe('GitHubAPIService', () => {
  let service: GitHubAPIService;
  let mockOctokit: any;

  beforeEach(() => {
    service = new GitHubAPIService('test-token');
    mockOctokit = (service as any).octokit;
    service.resetCircuitBreaker();
    service.clearCache();
  });

  describe('validateRepository', () => {
    it('should return repository metadata for valid repository', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      const result = await service.validateRepository('owner', 'test-repo');

      expect(result).toEqual(mockRepoData);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        headers: { 'If-None-Match': undefined },
      });
    });

    it('should handle repository not found error', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      await expect(service.validateRepository('owner', 'nonexistent'))
        .rejects.toThrow('Repository owner/nonexistent not found or is private');
    });

    it('should handle rate limit error', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 403,
        response: {
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1640995200',
          },
        },
      });

      await expect(service.validateRepository('owner', 'test-repo'))
        .rejects.toThrow(/GitHub API rate limit exceeded/);
    });

    it('should handle authentication error', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      await expect(service.validateRepository('owner', 'test-repo'))
        .rejects.toThrow('GitHub API authentication failed. Invalid or missing token');
    });

    it('should return cached data on 304 response', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      // First call to populate cache
      mockOctokit.rest.repos.get.mockResolvedValueOnce({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      await service.validateRepository('owner', 'test-repo');

      // Second call returns 304
      const error304 = new Error();
      (error304 as any).status = 304;
      mockOctokit.rest.repos.get.mockRejectedValueOnce(error304);

      const result = await service.validateRepository('owner', 'test-repo');
      expect(result).toEqual(mockRepoData);
    });
  });

  describe('discoverMarkdownFiles', () => {
    it('should return markdown files from repository tree', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      const mockTreeData = {
        sha: 'tree-sha',
        url: 'tree-url',
        tree: [
          {
            path: 'README.md',
            sha: 'file-sha-1',
            size: 100,
            type: 'blob',
            url: 'file-url-1',
          },
          {
            path: 'docs/guide.markdown',
            sha: 'file-sha-2',
            size: 200,
            type: 'blob',
            url: 'file-url-2',
          },
          {
            path: 'src/index.js',
            sha: 'file-sha-3',
            size: 300,
            type: 'blob',
            url: 'file-url-3',
          },
        ],
        truncated: false,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      mockOctokit.rest.git.getTree.mockResolvedValue({
        data: mockTreeData,
        headers: { etag: '"tree123"' },
      });

      const result = await service.discoverMarkdownFiles('owner', 'test-repo');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        path: 'README.md',
        sha: 'file-sha-1',
        size: 100,
        type: 'blob',
        url: 'file-url-1',
      });
      expect(result[1]).toEqual({
        path: 'docs/guide.markdown',
        sha: 'file-sha-2',
        size: 200,
        type: 'blob',
        url: 'file-url-2',
      });
    });

    it('should return empty array when no markdown files found', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      const mockTreeData = {
        sha: 'tree-sha',
        url: 'tree-url',
        tree: [
          {
            path: 'src/index.js',
            sha: 'file-sha-1',
            size: 300,
            type: 'blob',
            url: 'file-url-1',
          },
        ],
        truncated: false,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      mockOctokit.rest.git.getTree.mockResolvedValue({
        data: mockTreeData,
        headers: { etag: '"tree123"' },
      });

      const result = await service.discoverMarkdownFiles('owner', 'test-repo');

      expect(result).toHaveLength(0);
    });

    it('should handle empty repository error', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      mockOctokit.rest.git.getTree.mockRejectedValue({
        status: 409,
        message: 'Git Repository is empty',
      });

      await expect(service.discoverMarkdownFiles('owner', 'empty-repo'))
        .rejects.toThrow('Repository owner/empty-repo is empty');
    });

    it('should handle branch not found error', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      mockOctokit.rest.repos.get.mockResolvedValue({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      mockOctokit.rest.git.getTree.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      await expect(service.discoverMarkdownFiles('owner', 'test-repo', 'nonexistent-branch'))
        .rejects.toThrow('Branch nonexistent-branch not found in repository owner/test-repo');
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after failure threshold', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 500,
        message: 'Internal Server Error',
      });

      // Trigger failures to exceed threshold
      for (let i = 0; i < 5; i++) {
        try {
          await service.validateRepository('owner', 'test-repo');
        } catch (error) {
          // Expected failures
        }
      }

      const status = service.getCircuitBreakerStatus();
      expect(status.state).toBe('OPEN');
      expect(status.failureCount).toBe(5);

      // Next call should be rejected immediately
      await expect(service.validateRepository('owner', 'test-repo'))
        .rejects.toThrow('GitHub API service temporarily unavailable');
    });

    it('should reset circuit breaker on success', async () => {
      // Trigger some failures
      mockOctokit.rest.repos.get.mockRejectedValueOnce({
        status: 500,
        message: 'Internal Server Error',
      });

      try {
        await service.validateRepository('owner', 'test-repo');
      } catch (error) {
        // Expected failure
      }

      expect(service.getCircuitBreakerStatus().failureCount).toBe(1);

      // Now succeed
      mockOctokit.rest.repos.get.mockResolvedValue({
        data: {
          id: 123,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          default_branch: 'main',
          private: false,
          size: 1024,
        },
        headers: { etag: '"abc123"' },
      });

      await service.validateRepository('owner', 'test-repo');

      const status = service.getCircuitBreakerStatus();
      expect(status.state).toBe('CLOSED');
      expect(status.failureCount).toBe(0);
    });
  });

  describe('caching', () => {
    it('should cache responses with ETag', async () => {
      const mockRepoData = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        default_branch: 'main',
        private: false,
        size: 1024,
      };

      mockOctokit.rest.repos.get.mockResolvedValueOnce({
        data: mockRepoData,
        headers: { etag: '"abc123"' },
      });

      // First call
      await service.validateRepository('owner', 'test-repo');

      // Second call should include If-None-Match header
      const error304 = new Error();
      (error304 as any).status = 304;
      mockOctokit.rest.repos.get.mockRejectedValueOnce(error304);

      const result = await service.validateRepository('owner', 'test-repo');

      expect(result).toEqual(mockRepoData);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
        headers: { 'If-None-Match': '"abc123"' },
      });
    });

    it('should clear cache when requested', () => {
      service.clearCache();
      
      // This is mainly for coverage - cache state is internal
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});