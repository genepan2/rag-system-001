import { NextRequest, NextResponse } from 'next/server';
import { GitHubAPIService } from '../../(lib)/github-api-service';

interface IngestRequest {
  repositoryUrl: string;
}

interface IngestResponse {
  message: string;
  documentCount: number;
}

function parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
  try {
    const githubUrlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/;
    const match = url.match(githubUrlPattern);
    
    if (!match) {
      return null;
    }
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<IngestResponse>> {
  const githubService = new GitHubAPIService(process.env.GITHUB_TOKEN);

  try {
    const body: IngestRequest = await request.json();
    
    if (!body.repositoryUrl) {
      return NextResponse.json(
        { message: 'Repository URL is required', documentCount: 0 },
        { status: 400 }
      );
    }

    // Parse GitHub repository URL
    const repoInfo = parseRepositoryUrl(body.repositoryUrl);
    if (!repoInfo) {
      return NextResponse.json(
        { message: 'Invalid GitHub repository URL format', documentCount: 0 },
        { status: 400 }
      );
    }

    // Validate repository access
    await githubService.validateRepository(repoInfo.owner, repoInfo.repo);

    // Discover markdown files
    const markdownFiles = await githubService.discoverMarkdownFiles(repoInfo.owner, repoInfo.repo);

    return NextResponse.json({
      message: 'Ingestion started.',
      documentCount: markdownFiles.length
    });

  } catch (error: any) {
    console.error('Ingest API error:', error);

    // Handle specific GitHub API errors
    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        { message: error.message, documentCount: 0 },
        { status: 429 }
      );
    }

    if (error.message.includes('not found') || error.message.includes('private')) {
      return NextResponse.json(
        { message: error.message, documentCount: 0 },
        { status: 404 }
      );
    }

    if (error.message.includes('authentication') || error.message.includes('forbidden')) {
      return NextResponse.json(
        { message: error.message, documentCount: 0 },
        { status: 403 }
      );
    }

    if (error.message.includes('temporarily unavailable')) {
      return NextResponse.json(
        { message: error.message, documentCount: 0 },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error', documentCount: 0 },
      { status: 500 }
    );
  }
}