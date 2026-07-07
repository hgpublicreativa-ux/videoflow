import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const drive = google.drive('v3');

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export class GoogleDriveService {
  private auth: OAuth2Client;

  constructor(refreshToken: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.auth.setCredentials({
      refresh_token: refreshToken,
    });
  }

  async listVideosInFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const videoMimes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-matroska',
        'application/x-matroska',
      ];

      const query = videoMimes.map(mime => `mimeType='${mime}'`).join(' or ');

      const response = await drive.files.list({
        auth: this.auth,
        q: `'${folderId}' in parents and (${query}) and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, mimeType)',
        pageSize: 100,
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing videos:', error);
      throw error;
    }
  }

  async renameFile(fileId: string, newName: string): Promise<void> {
    try {
      await drive.files.update({
        auth: this.auth,
        fileId,
        requestBody: {
          name: newName,
        },
      });
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  }

  async moveFile(fileId: string, newParentId: string): Promise<void> {
    try {
      const file = await drive.files.get({
        auth: this.auth,
        fileId,
        fields: 'parents',
      });

      const previousParents = file.data.parents?.join(',') || '';

      await drive.files.update({
        auth: this.auth,
        fileId,
        addParents: newParentId,
        removeParents: previousParents,
        fields: 'id, parents',
      });
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string, filePath: string): Promise<void> {
    try {
      const response = await drive.files.get(
        {
          auth: this.auth,
          fileId,
          alt: 'media',
        },
        {
          responseType: 'stream',
        }
      );

      const fs = await import('fs');
      const writeStream = fs.createWriteStream(filePath);

      response.data.pipe(writeStream);

      return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
