import { POST } from '../app/api/ingest/route';
import { GitService } from '../app/(lib)/git-service';
import { FileService } from '../app/(lib)/file-service';

// Mock the services
jest.mock('../app/(lib)/git-service');
jest.mock('../app/(lib)/file-service');

const mockGitService = GitService as jest.MockedClass<typeof GitService>;
const mockFileService = FileService as jest.MockedClass<typeof FileService>;

// Create mock NextRequest that bypasses NextRequest constructor issues
function createMockRequest(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body)
  } as any;
}

describe('/api/ingest', () => {
  let mockGitInstance: jest.Mocked<GitService>;
  let mockFileInstance: jest.Mocked<FileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGitInstance = {
      validateRepositoryUrl: jest.fn(),
      cloneRepository: jest.fn()
    } as any;
    
    mockFileInstance = {
      findMarkdownFiles: jest.fn(),
      fileExists: jest.fn()
    } as any;
    
    mockGitService.mockImplementation(() => mockGitInstance);
    mockFileService.mockImplementation(() => mockFileInstance);
  });

  it('should return 400 when repository URL is missing', async () => {
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Repository URL is required');
    expect(data.documentCount).toBe(0);
    expect(mockGitInstance.validateRepositoryUrl).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid repository URL', async () => {
    mockGitInstance.validateRepositoryUrl.mockResolvedValue(false);
    
    const request = createMockRequest({ repositoryUrl: 'invalid-url' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid or inaccessible repository URL');
    expect(data.documentCount).toBe(0);
    expect(mockGitInstance.validateRepositoryUrl).toHaveBeenCalledWith('invalid-url');
    expect(mockGitInstance.cloneRepository).not.toHaveBeenCalled();
  });

  it('should successfully process valid repository with markdown files', async () => {
    const mockCleanup = jest.fn().mockResolvedValue(undefined);
    mockGitInstance.validateRepositoryUrl.mockResolvedValue(true);
    mockGitInstance.cloneRepository.mockResolvedValue({
      localPath: '/tmp/test-repo',
      cleanup: mockCleanup
    });
    mockFileInstance.findMarkdownFiles.mockResolvedValue(['README.md', 'docs/guide.md']);
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/repo' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Ingestion started.');
    expect(data.documentCount).toBe(2);
    expect(mockGitInstance.validateRepositoryUrl).toHaveBeenCalledWith('https://github.com/test/repo');
    expect(mockGitInstance.cloneRepository).toHaveBeenCalledWith('https://github.com/test/repo');
    expect(mockFileInstance.findMarkdownFiles).toHaveBeenCalledWith('/tmp/test-repo');
    expect(mockCleanup).toHaveBeenCalled();
  });

  it('should handle repository with no markdown files', async () => {
    const mockCleanup = jest.fn().mockResolvedValue(undefined);
    mockGitInstance.validateRepositoryUrl.mockResolvedValue(true);
    mockGitInstance.cloneRepository.mockResolvedValue({
      localPath: '/tmp/empty-repo',
      cleanup: mockCleanup
    });
    mockFileInstance.findMarkdownFiles.mockResolvedValue([]);
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/empty' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Ingestion started.');
    expect(data.documentCount).toBe(0);
    expect(mockCleanup).toHaveBeenCalled();
  });

  it('should handle git clone failures', async () => {
    mockGitInstance.validateRepositoryUrl.mockResolvedValue(true);
    mockGitInstance.cloneRepository.mockRejectedValue(new Error('Clone failed'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/fail' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
    expect(data.documentCount).toBe(0);
    expect(mockGitInstance.cloneRepository).toHaveBeenCalledWith('https://github.com/test/fail');
    expect(mockFileInstance.findMarkdownFiles).not.toHaveBeenCalled();
  });

  it('should handle file scanning failures and cleanup', async () => {
    const mockCleanup = jest.fn().mockResolvedValue(undefined);
    mockGitInstance.validateRepositoryUrl.mockResolvedValue(true);
    mockGitInstance.cloneRepository.mockResolvedValue({
      localPath: '/tmp/test-repo',
      cleanup: mockCleanup
    });
    mockFileInstance.findMarkdownFiles.mockRejectedValue(new Error('Scan failed'));
    
    const request = createMockRequest({ repositoryUrl: 'https://github.com/test/scan-fail' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Internal server error');
    expect(data.documentCount).toBe(0);
    expect(mockCleanup).toHaveBeenCalled();
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
    expect(mockGitInstance.validateRepositoryUrl).not.toHaveBeenCalled();
  });
});