import { Project } from './types';
import path from 'path';
import fs from 'fs';

export class ConfigLoader {
  private configPath: string;

  constructor() {
    this.configPath = process.env.CONFIG_PATH || './config/projects.json';
  }

  loadProjects(): Project[] {
    // Prioridad: env var PROJECTS_JSON (persiste en Railway). Fallback: archivo.
    const envJson = process.env.PROJECTS_JSON;
    if (envJson) {
      try {
        const projects = JSON.parse(envJson);
        return Array.isArray(projects) ? projects : [projects];
      } catch (error) {
        console.error('Error parsing PROJECTS_JSON env var:', error);
      }
    }

    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Config file not found at ${this.configPath}`);
        return [];
      }

      const data = fs.readFileSync(this.configPath, 'utf-8');
      const projects = JSON.parse(data);

      return Array.isArray(projects) ? projects : [projects];
    } catch (error) {
      console.error('Error loading config:', error);
      return [];
    }
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
