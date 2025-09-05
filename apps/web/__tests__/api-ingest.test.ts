/**
 * @jest-environment node
 */
import { POST } from '../app/api/ingest/route';
import { GitHubAPIService } from '../app/(lib)/github-api-service';

// Mock the GitHub API service
jest.mock('../app/(lib)/github-api-service');

const mockGitHubAPIService = GitHubAPIService as jest.MockedClass<typeof GitHubAPIService>;

// Create mock NextRequest that bypasses NextRequest constructor issues
function createMockRequest(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body)
  } as any;
}

describe('/api/ingest', () => {
  let mockGitHubInstance: jest.Mocked<GitHubAPIService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGitHubInstance = {
      validateRepository: jest.fn(),
      discoverMarkdownFiles: jest.fn(),
      getCircuitBreakerStatus: jest.fn(),
      resetCircuitBreaker: jest.fn(),
      clearCache: jest.fn()
    } as any;
    
    mockGitHubAPIService.mockImplementation(() => mockGitHubInstance);
  });

  it('should return 400 when repository URL is missing', async () => {
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Repository URL is required');
    expect(data.documentCount).toBe(0);
    expect(mockGitHubInstance.validateRepository).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid GitHub repository URL format', async () => {
    const request = createMockRequest({ repositoryUrl: 'invalid-url' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid GitHub repository URL format');
    expect(data.documentCount).toBe(0);
    expect(mockGitHubInstance.validateRepository).not.toHaveBeenCalled();
  });

  it('should successfully process valid repository with markdown files', async () => {
    const mockRepoData = {
      id: 123,
      name: 'repo',
      full_name: 'test/repo',
      default_branch: 'main',
      private: false,
      size: 1024,
    };
    
    const mockMarkdownFiles = [
      { path: 'README.md', sha: 'sha1', size: 100, type: 'blob' as const, url: 'url1' },
      { path: 'docs/guide.md', sha: 'sha2', size: 200, type: 'blob' as const, url: 'url2' }
    ];
    
    mockGitHubInstance.validateRepository.mockResolvedValue(mockRepoData);
    mockGitHubInstance.discoverMarkdownFiles.mockResolvedValue(mockMarkdownFiles);
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/repo' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Ingestion started.');
    expect(data.documentCount).toBe(2);
    expect(mockGitHubInstance.validateRepository).toHaveBeenCalledWith('test', 'repo');
    expect(mockGitHubInstance.discoverMarkdownFiles).toHaveBeenCalledWith('test', 'repo');
  });

  it('should handle repository with no markdown files', async () => {
    const mockRepoData = {
      id: 123,
      name: 'empty',
      full_name: 'test/empty',
      default_branch: 'main',
      private: false,
      size: 1024,
    };
    
    mockGitHubInstance.validateRepository.mockResolvedValue(mockRepoData);
    mockGitHubInstance.discoverMarkdownFiles.mockResolvedValue([]);
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/empty' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Ingestion started.');
    expect(data.documentCount).toBe(0);
  });

  it('should handle repository not found error', async () => {
    mockGitHubInstance.validateRepository.mockRejectedValue(new Error('Repository test/fail not found or is private'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/fail' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Repository test/fail not found or is private');
    expect(data.documentCount).toBe(0);
    expect(mockGitHubInstance.discoverMarkdownFiles).not.toHaveBeenCalled();
  });

  it('should handle rate limit error', async () => {
    mockGitHubInstance.validateRepository.mockRejectedValue(new Error('GitHub API rate limit exceeded. Resets at 2024-01-01T00:00:00.000Z'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/rate-limited' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.message).toContain('GitHub API rate limit exceeded');
    expect(data.documentCount).toBe(0);
  });

  it('should handle authentication error', async () => {
    mockGitHubInstance.validateRepository.mockRejectedValue(new Error('GitHub API authentication failed. Invalid or missing token'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/auth-fail' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe('GitHub API authentication failed. Invalid or missing token');
    expect(data.documentCount).toBe(0);
  });

  it('should handle circuit breaker open', async () => {
    mockGitHubInstance.validateRepository.mockRejectedValue(new Error('GitHub API service temporarily unavailable'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/circuit-open' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe('GitHub API service temporarily unavailable');
    expect(data.documentCount).toBe(0);
  });

  it('should handle malformed JSON', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
    expect(data.documentCount).toBe(0);
    expect(mockGitHubInstance.validateRepository).not.toHaveBeenCalled();
  });

  it('should handle various GitHub URL formats', async () => {
    const mockRepoData = {
      id: 123,
      name: 'repo',
      full_name: 'owner/repo',
      default_branch: 'main',
      private: false,
      size: 1024,
    };
    
    mockGitHubInstance.validateRepository.mockResolvedValue(mockRepoData);
    mockGitHubInstance.discoverMarkdownFiles.mockResolvedValue([]);

    // Test with .git suffix
    const request1 = createMockRequest({ repositoryUrl: 'https://github.com/owner/repo.git' });
    const response1 = await POST(request1);
    expect(response1.status).toBe(200);
    expect(mockGitHubInstance.validateRepository).toHaveBeenCalledWith('owner', 'repo');

    // Test with trailing slash
    const request2 = createMockRequest({ repositoryUrl: 'https://github.com/owner/repo/' });
    const response2 = await POST(request2);
    expect(response2.status).toBe(200);
    expect(mockGitHubInstance.validateRepository).toHaveBeenCalledWith('owner', 'repo');
  });
});