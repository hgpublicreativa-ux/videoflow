import ffmpeg from 'fluent-ffmpeg';
import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

export class FFmpegService {
  constructor() {
    // Usa FFMPEG_PATH solo si es path absoluto valido; si no, binario bundled (ffmpeg-static).
    const envPath = process.env.FFMPEG_PATH;
    const ffmpegPath =
      envPath && envPath.startsWith('/') ? envPath : ffmpegStatic;
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
  }

  async checkFFmpegInstalled(): Promise<boolean> {
    try {
      execSync('ffmpeg -version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async extractAudio(
    videoPath: string,
    audioPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .on('error', (err: Error) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          resolve();
        })
        .save(audioPath);
    });
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: any) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration || 0;
          resolve(duration);
        }
      });
    });
  }
}
