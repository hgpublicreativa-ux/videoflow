export interface Project {
  nombre: string;
  activo: boolean;
  driveAccount: string;
  inputFolderId: string;
  finalFolderId: string;
  reviewFolderId: string;
  errorFolderId: string;
}

export interface ProcessingResult {
  projectName: string;
  videosFound: number;
  videosProcessed: number;
  videosMoved: number;
  videosReview: number;
  videosError: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  message: string;
}

export interface VideoMetadata {
  participantes: string[];
  situacion: string;
  nombre_archivo: string;
  confianza: 'alta' | 'media' | 'baja';
}

export interface ExecutionLog {
  timestamp: Date;
  projectName: string;
  fileName: string;
  status: 'success' | 'review' | 'error';
  metadata?: VideoMetadata;
  error?: string;
}
