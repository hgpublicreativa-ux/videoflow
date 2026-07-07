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

      return (response.data.files || [])
        .filter((f): f is { id: string; name: string; mimeType: string } =>
          !!f.id && !!f.name && !!f.mimeType
        );
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

  async listAudioInFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await drive.files.list({
        auth: this.auth,
        q: `'${folderId}' in parents and mimeType contains 'audio/' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, mimeType)',
        pageSize: 200,
      });

      return (response.data.files || [])
        .filter((f): f is { id: string; name: string; mimeType: string } =>
          !!f.id && !!f.name && !!f.mimeType
        );
    } catch (error) {
      console.error('Error listing audio:', error);
      throw error;
    }
  }

  async uploadFile(
    filePath: string,
    name: string,
    parentId: string,
    mimeType = 'video/mp4'
  ): Promise<string> {
    try {
      const fs = await import('fs');
      const res = await drive.files.create({
        auth: this.auth,
        requestBody: { name, parents: [parentId] },
        media: { mimeType, body: fs.createReadStream(filePath) },
        fields: 'id',
      });
      return res.data.id as string;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async trashFile(fileId: string): Promise<void> {
    try {
      await drive.files.update({
        auth: this.auth,
        fileId,
        requestBody: { trashed: true },
      });
    } catch (error) {
      console.error('Error trashing file:', error);
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
