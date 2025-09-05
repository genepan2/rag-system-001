import { Octokit } from '@octokit/rest';

interface GitHubFile {
  path: string;
  sha: string;
  size: number;
  type: 'blob' | 'tree';
  url: string;
}

interface RepositoryMetadata {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  size: number;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubFile[];
  truncated: boolean;
}

export class GitHubAPIService {
  private octokit: Octokit;
  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1 minute
  private etagCache = new Map<string, { etag: string; data: any; timestamp: number }>();

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
      request: {
        timeout: 10000,
      },
    });
  }

  private isCircuitOpen(): boolean {
    if (this.circuitBreakerState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.circuitBreakerState = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  private handleSuccess() {
    this.failureCount = 0;
    this.circuitBreakerState = 'CLOSED';
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.circuitBreakerState = 'OPEN';
    }
  }

  private getCacheKey(url: string, params?: any): string {
    return `${url}_${JSON.stringify(params || {})}`;
  }

  private getCachedResponse(cacheKey: string, etag?: string) {
    const cached = this.etagCache.get(cacheKey);
    if (cached && etag && cached.etag === etag) {
      const age = Date.now() - cached.timestamp;
      if (age < 3600000) { // 1 hour cache
        return cached.data;
      }
    }
    return null;
  }

  private setCachedResponse(cacheKey: string, etag: string, data: any) {
    this.etagCache.set(cacheKey, {
      etag,
      data,
      timestamp: Date.now(),
    });
  }

  async validateRepository(owner: string, repo: string): Promise<RepositoryMetadata> {
    if (this.isCircuitOpen()) {
      throw new Error('GitHub API service temporarily unavailable');
    }

    const cacheKey = this.getCacheKey(`/repos/${owner}/${repo}`);
    
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
        headers: {
          'If-None-Match': this.etagCache.get(cacheKey)?.etag,
        },
      });

      this.handleSuccess();

      const etag = response.headers.etag;
      if (etag) {
        this.setCachedResponse(cacheKey, etag, response.data);
      }

      return {
        id: response.data.id,
        name: response.data.name,
        full_name: response.data.full_name,
        default_branch: response.data.default_branch,
        private: response.data.private,
        size: response.data.size,
      };
    } catch (error: any) {
      if (error.status === 304) {
        // Not modified, return cached data
        const cached = this.etagCache.get(cacheKey);
        if (cached) {
          this.handleSuccess();
          return cached.data;
        }
      }

      this.handleFailure();

      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or is private`);
      }
      
      if (error.status === 403) {
        const rateLimitRemaining = error.response?.headers['x-ratelimit-remaining'];
        const rateLimitReset = error.response?.headers['x-ratelimit-reset'];
        
        if (rateLimitRemaining === '0') {
          const resetTime = new Date(parseInt(rateLimitReset) * 1000);
          throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toISOString()}`);
        }
        
        throw new Error('GitHub API access forbidden. Check authentication token');
      }

      if (error.status === 401) {
        throw new Error('GitHub API authentication failed. Invalid or missing token');
      }

      throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
    }
  }

  async discoverMarkdownFiles(owner: string, repo: string, branch?: string): Promise<GitHubFile[]> {
    if (this.isCircuitOpen()) {
      throw new Error('GitHub API service temporarily unavailable');
    }

    // First get repository info to get default branch if not specified
    const repoInfo = await this.validateRepository(owner, repo);
    const targetBranch = branch || repoInfo.default_branch;

    const cacheKey = this.getCacheKey(`/repos/${owner}/${repo}/git/trees/${targetBranch}`, { recursive: true });

    try {
      const response = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: targetBranch,
        recursive: 'true',
        headers: {
          'If-None-Match': this.etagCache.get(cacheKey)?.etag,
        },
      });

      this.handleSuccess();

      const etag = response.headers.etag;
      if (etag) {
        this.setCachedResponse(cacheKey, etag, response.data);
      }

      const treeData = response.data as GitHubTreeResponse;
      
      // Filter for markdown files
      const markdownFiles = treeData.tree.filter(file => 
        file.type === 'blob' && 
        (file.path.endsWith('.md') || file.path.endsWith('.markdown'))
      );

      return markdownFiles.map(file => ({
        path: file.path,
        sha: file.sha,
        size: file.size,
        type: file.type,
        url: file.url,
      }));
    } catch (error: any) {
      if (error.status === 304) {
        // Not modified, return cached data
        const cached = this.etagCache.get(cacheKey);
        if (cached) {
          this.handleSuccess();
          const treeData = cached.data as GitHubTreeResponse;
          const markdownFiles = treeData.tree.filter(file => 
            file.type === 'blob' && 
            (file.path.endsWith('.md') || file.path.endsWith('.markdown'))
          );
          return markdownFiles;
        }
      }

      this.handleFailure();

      if (error.status === 404) {
        throw new Error(`Branch ${targetBranch} not found in repository ${owner}/${repo}`);
      }

      if (error.status === 409) {
        throw new Error(`Repository ${owner}/${repo} is empty`);
      }

      if (error.status === 403) {
        const rateLimitRemaining = error.response?.headers['x-ratelimit-remaining'];
        if (rateLimitRemaining === '0') {
          throw new Error('GitHub API rate limit exceeded while discovering files');
        }
      }

      throw new Error(`Failed to discover markdown files: ${error.message}`);
    }
  }

  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreakerState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  resetCircuitBreaker() {
    this.circuitBreakerState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  clearCache() {
    this.etagCache.clear();
  }
}