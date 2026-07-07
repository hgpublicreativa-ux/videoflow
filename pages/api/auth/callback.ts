import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface AuthResponse {
  success: boolean;
  message: string;
  refreshToken?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code not provided',
    });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code as string);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      refreshToken: tokens.refresh_token,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
