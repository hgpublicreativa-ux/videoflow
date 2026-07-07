import type { NextApiRequest, NextApiResponse } from 'next';
import { VideoProcessor } from '../../lib/processor';
import { ConfigLoader } from '../../lib/config-loader';

interface ProcessResponse {
  success: boolean;
  message: string;
  results?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { projectName } = req.body;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive not configured. Please authenticate first.',
      });
    }

    const processor = new VideoProcessor(refreshToken);
    const configLoader = new ConfigLoader();

    let results;

    if (projectName) {
      const projects = configLoader.getActiveProjects();
      const project = projects.find(p => p.nombre === projectName);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: `Project "${projectName}" not found`,
        });
      }

      results = [await processor.processProject(project)];
    } else {
      results = await processor.processAllProjects();
    }

    res.status(200).json({
      success: true,
      message: 'Processing completed',
      results,
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
