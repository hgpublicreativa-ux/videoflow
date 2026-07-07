import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfigLoader } from '../../lib/config-loader';
import { Project } from '../../lib/types';

interface ProjectResponse {
  success: boolean;
  message: string;
  data?: Project | Project[];
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProjectResponse>
) {
  const configLoader = new ConfigLoader();

  try {
    switch (req.method) {
      case 'GET':
        const projects = configLoader.loadProjects();
        return res.status(200).json({
          success: true,
          message: 'Projects retrieved',
          data: projects,
        });

      case 'POST':
        const newProject = req.body as Project;
        configLoader.addProject(newProject);
        return res.status(201).json({
          success: true,
          message: 'Project created',
          data: newProject,
        });

      case 'PUT':
        const { nombre, ...updates } = req.body;
        configLoader.updateProject(nombre, updates);
        return res.status(200).json({
          success: true,
          message: 'Project updated',
        });

      case 'DELETE':
        const { projectName } = req.body;
        configLoader.deleteProject(projectName);
        return res.status(200).json({
          success: true,
          message: 'Project deleted',
        });

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
