import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfigLoader } from '../../../lib/config-loader';

interface ToggleResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ToggleResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { projectName } = req.body;
    const configLoader = new ConfigLoader();

    configLoader.toggleProjectActive(projectName);

    res.status(200).json({
      success: true,
      message: `Project "${projectName}" toggled`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
