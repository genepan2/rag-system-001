import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '../../(lib)/git-service';
import { FileService } from '../../(lib)/file-service';

interface IngestRequest {
  repositoryUrl: string;
}

interface IngestResponse {
  message: string;
  documentCount: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<IngestResponse>> {
  const gitService = new GitService();
  const fileService = new FileService();
  let cleanup: (() => Promise<void>) | null = null;

  try {
    const body: IngestRequest = await request.json();
    
    if (!body.repositoryUrl) {
      return NextResponse.json(
        { message: 'Repository URL is required', documentCount: 0 },
        { status: 400 }
      );
    }

    // Validate repository URL
    const isValidRepo = await gitService.validateRepositoryUrl(body.repositoryUrl);
    if (!isValidRepo) {
      return NextResponse.json(
        { message: 'Invalid or inaccessible repository URL', documentCount: 0 },
        { status: 400 }
      );
    }

    // Clone repository
    const { localPath, cleanup: cleanupFn } = await gitService.cloneRepository(body.repositoryUrl);
    cleanup = cleanupFn;

    // Find markdown files
    const markdownFiles = await fileService.findMarkdownFiles(localPath);

    // Cleanup cloned repository
    await cleanup();
    cleanup = null;

    return NextResponse.json({
      message: 'Ingestion started.',
      documentCount: markdownFiles.length
    });

  } catch (error) {
    console.error('Ingest API error:', error);
    
    // Ensure cleanup on error
    if (cleanup) {
      try {
        await cleanup();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return NextResponse.json(
      { message: 'Internal server error', documentCount: 0 },
      { status: 500 }
    );
  }
}