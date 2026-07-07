import { Project } from './types';
import path from 'path';
import fs from 'fs';

// Proyectos fijos. Siempre presentes, no dependen de env var ni archivo.
const FIXED_PROJECTS: Project[] = [
  {
    nombre: 'zonal gol',
    activo: true,
    driveAccount: 'account1',
    inputFolderId: '1EzFB_ObyombPBbgsMdIRnnQqxk4yincI',
    finalFolderId: '1mdpCoJ78f6lwSSweE2FuBDXEZBl9dUue',
    reviewFolderId: '1hmA1n4JJALfPjKYf3hXI19pNLJB6Ro9c',
    errorFolderId: '1IbhiH2ezi6dqVbA9pw4KgMwZK7TmfLG5',
  },
  {
    nombre: 'tvec',
    activo: true,
    driveAccount: 'account1',
    inputFolderId: '1H-lbuKxZ-OGXdpAVrNMVFJTW8PYq3-NS',
    finalFolderId: '1bS10pVFvvxai-gbE14oMAI4qboSmie2-',
    reviewFolderId: '1jbNe7Uj5BahAiosQtN-kWqjSZXYIq-2V',
    errorFolderId: '1qmSrIkT51Xw1U_Do8cqe02C61rjjU638',
  },
  {
    nombre: 'famosos reales',
    activo: true,
    driveAccount: 'account1',
    inputFolderId: '1SZjx-NatnNzehGESzwLI0SaEI1AMxRnQ',
    finalFolderId: '1Uk_FJ3xqpar2kgUQWDZWYZFIFazcWMrV',
    reviewFolderId: '1teE_axtpFujvLU7UBjJ9kPl1G5ixQrkw',
    errorFolderId: '1sGknrr5WFn4AxJRtS5mFXxfjDCzDq9KU',
  },
];

export class ConfigLoader {
  private configPath: string;

  constructor() {
    this.configPath = process.env.CONFIG_PATH || './config/projects.json';
  }

  loadProjects(): Project[] {
    // Proyectos fijos (hardcoded) + extras de env var / archivo, sin duplicar.
    const projects: Project[] = [...FIXED_PROJECTS];
    const names = new Set(projects.map(p => p.nombre));

    const merge = (extra: Project[]) => {
      for (const p of extra) {
        if (!names.has(p.nombre)) {
          projects.push(p);
          names.add(p.nombre);
        }
      }
    };

    const envJson = process.env.PROJECTS_JSON;
    if (envJson) {
      try {
        const parsed = JSON.parse(envJson);
        merge(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (error) {
        console.error('Error parsing PROJECTS_JSON env var:', error);
      }
    }

    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);
        merge(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch (error) {
      console.error('Error loading config file:', error);
    }

    return projects;
  }

  getActiveProjects(): Project[] {
    const projects = this.loadProjects();
    return projects.filter(p => p.activo === true);
  }

  saveProjects(projects: Project[]): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(projects, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  addProject(project: Project): void {
    const projects = this.loadProjects();
    projects.push(project);
    this.saveProjects(projects);
  }

  updateProject(projectName: string, updates: Partial<Project>): void {
    const projects = this.loadProjects();
    const index = projects.findIndex(p => p.nombre === projectName);

    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      this.saveProjects(projects);
    }
  }

  deleteProject(projectName: string): void {
    const projects = this.loadProjects();
    const filtered = projects.filter(p => p.nombre !== projectName);
    this.saveProjects(filtered);
  }

  toggleProjectActive(projectName: string): void {
    const projects = this.loadProjects();
    const project = projects.find(p => p.nombre === projectName);

    if (project) {
      project.activo = !project.activo;
      this.saveProjects(projects);
    }
  }
}
