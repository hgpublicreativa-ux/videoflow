import type { NextApiRequest, NextApiResponse } from 'next';
import { VideoProcessor } from '../../lib/processor';

interface CronResponse {
  success: boolean;
  message: string;
  timestamp: string;
  results?: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const cronSecret = req.headers['x-cron-secret'] as string;

  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Invalid cron secret',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive not configured',
        timestamp: new Date().toISOString(),
      });
    }

    const processor = new VideoProcessor(refreshToken);
    const results = await processor.processAllProjects();

    res.status(200).json({
      success: true,
      message: 'Scheduled processing completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Cron processing error:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }
}
