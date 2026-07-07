import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfigLoader } from '../../lib/config-loader';

interface StatusResponse {
  success: boolean;
  status: string;
  projectsActive: number;
  projectsTotal: number;
  timestamp: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'Method not allowed',
      projectsActive: 0,
      projectsTotal: 0,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const configLoader = new ConfigLoader();
    const projects = configLoader.loadProjects();
    const activeProjects = configLoader.getActiveProjects();

    res.status(200).json({
      success: true,
      status: 'OK',
      projectsActive: activeProjects.length,
      projectsTotal: projects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      projectsActive: 0,
      projectsTotal: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
