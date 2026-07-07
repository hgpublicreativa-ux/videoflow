import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleDriveService } from './google-drive';
import { OpenAIService } from './openai';
import { FFmpegService } from './ffmpeg';
import { ConfigLoader } from './config-loader';
import { Project, ProcessingResult, ExecutionLog } from './types';

export class VideoProcessor {
  private driveService: GoogleDriveService | null = null;
  private openaiService: OpenAIService;
  private ffmpegService: FFmpegService;
  private configLoader: ConfigLoader;
  private tempDir: string;
  private executionLogs: ExecutionLog[] = [];

  constructor(refreshToken: string) {
    this.openaiService = new OpenAIService();
    this.ffmpegService = new FFmpegService();
    this.configLoader = new ConfigLoader();
    this.tempDir = path.join(os.tmpdir(), 'videoflow-' + Date.now());

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    if (refreshToken) {
      this.driveService = new GoogleDriveService(refreshToken);
    }
  }

  async processAllProjects(): Promise<ProcessingResult[]> {
    const startTime = new Date();
    const results: ProcessingResult[] = [];

    try {
      const projects = this.configLoader.getActiveProjects();

      if (projects.length === 0) {
        console.log('No active projects found');
        return [];
      }

      for (const project of projects) {
        const result = await this.processProject(project);
        results.push(result);
      }

      return results;
    } finally {
      this.cleanup();
    }
  }

  async processProject(project: Project): Promise<ProcessingResult> {
    const startTime = new Date();
    const result: ProcessingResult = {
      projectName: project.nombre,
      videosFound: 0,
      videosProcessed: 0,
      videosMoved: 0,
      videosReview: 0,
      videosError: 0,
      startTime,
      endTime: new Date(),
      duration: 0,
      success: false,
      message: 'Processing started',
    };

    try {
      if (!this.driveService) {
        throw new Error('Drive service not initialized');
      }

      const videos = await this.driveService.listVideosInFolder(
        project.inputFolderId
      );

      result.videosFound = videos.length;

      if (videos.length === 0) {
        result.message = 'No videos found in input folder';
        result.success = true;
        result.endTime = new Date();
        result.duration =
          result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      for (const video of videos) {
        await this.processVideo(project, video, result);
      }

      result.success = true;
      result.message = `Processed ${result.videosProcessed} videos`;
    } catch (error) {
      result.success = false;
      result.message = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      result.endTime = new Date();
      result.duration =
        result.endTime.getTime() - result.startTime.getTime();
    }

    return result;
  }

  private async processVideo(
    project: Project,
    video: any,
    result: ProcessingResult
  ): Promise<void> {
    const videoPath = path.join(this.tempDir, `${video.id}_temp`);
    const audioPath = path.join(this.tempDir, `${video.id}_audio.wav`);

    try {
      if (!this.driveService) {
        throw new Error('Drive service not initialized');
      }

      await this.driveService.downloadFile(video.id, videoPath);

      await this.ffmpegService.extractAudio(videoPath, audioPath);

      const transcription =
        await this.openaiService.transcribeAudio(audioPath);

      const metadata =
        await this.openaiService.analyzeTranscription(transcription);

      const isGeneric =
        this.openaiService.isGenericName(metadata.nombre_archivo);

      if (metadata.confianza === 'baja' || isGeneric) {
        await this.driveService.moveFile(video.id, project.reviewFolderId);
        result.videosReview++;

        this.executionLogs.push({
          timestamp: new Date(),
          projectName: project.nombre,
          fileName: video.name,
          status: 'review',
          metadata,
        });
      } else {
        const sanitizedName = this.driveService.sanitizeFileName(
          metadata.nombre_archivo
        );

        if (project.musicFolderId) {
          // Flujo con musica: mezcla cancion aleatoria de fondo, sube video nuevo.
          const songs = await this.driveService.listAudioInFolder(
            project.musicFolderId
          );
          if (songs.length === 0) {
            throw new Error('Carpeta de musica vacia o sin audios');
          }
          const song = songs[Math.floor(Math.random() * songs.length)];
          const songPath = path.join(this.tempDir, `${video.id}_song`);
          const outPath = path.join(this.tempDir, `${video.id}_out.mp4`);

          await this.driveService.downloadFile(song.id, songPath);
          await this.ffmpegService.mixMusic(videoPath, songPath, outPath, 0.25);
          await this.driveService.uploadFile(
            outPath,
            sanitizedName,
            project.finalFolderId,
            'video/mp4'
          );
          // Manda el original a la papelera (ya subimos la version con musica).
          await this.driveService.trashFile(video.id);

          if (fs.existsSync(songPath)) fs.unlinkSync(songPath);
          if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        } else {
          await this.driveService.renameFile(video.id, sanitizedName);
          await this.driveService.moveFile(video.id, project.finalFolderId);
        }

        result.videosProcessed++;
        result.videosMoved++;

        this.executionLogs.push({
          timestamp: new Date(),
          projectName: project.nombre,
          fileName: video.name,
          status: 'success',
          metadata,
        });
      }
    } catch (error) {
      if (this.driveService) {
        await this.driveService
          .moveFile(video.id, project.errorFolderId)
          .catch(e => console.error('Error moving to error folder:', e));
      }
      result.videosError++;

      this.executionLogs.push({
        timestamp: new Date(),
        projectName: project.nombre,
        fileName: video.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }

  private cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }

  getExecutionLogs(): ExecutionLog[] {
    return this.executionLogs;
  }
}
