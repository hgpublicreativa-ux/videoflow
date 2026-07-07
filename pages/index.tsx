import React, { useState, useEffect } from 'react';
import styles from '../styles/home.module.css';

interface Project {
  nombre: string;
  activo: boolean;
  driveAccount: string;
  inputFolderId: string;
  finalFolderId: string;
  reviewFolderId: string;
  errorFolderId: string;
}

interface ProcessResult {
  projectName: string;
  videosFound: number;
  videosProcessed: number;
  videosMoved: number;
  videosReview: number;
  videosError: number;
  duration: number;
  success: boolean;
  message: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleProcessAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        alert(data.message || 'Error al procesar');
      }
    } catch (error) {
      console.error('Error processing:', error);
      alert('Error de conexión al procesar');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessProject = async (projectName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        alert(data.message || 'Error al procesar');
      }
    } catch (error) {
      console.error('Error processing project:', error);
      alert('Error de conexión al procesar');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProject = async (projectName: string) => {
    try {
      await fetch('/api/projects/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      });
      loadProjects();
    } catch (error) {
      console.error('Error toggling project:', error);
    }
  };

  const handleAddProject = async () => {
    if (!formData.nombre) {
      alert('Project name is required');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          activo: true,
        }),
      });

      if (response.ok) {
        setShowNewProject(false);
        setFormData({});
        loadProjects();
      }
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editingProject,
          ...formData,
        }),
      });

      if (response.ok) {
        setEditingProject(null);
        setFormData({});
        loadProjects();
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectName: string) => {
    if (!confirm(`Delete project "${projectName}"?`)) return;

    try {
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      });
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎬 VideoFlow</h1>
        <p>Automated Video Processor for Google Drive</p>
      </header>

      <main className={styles.main}>
        <section className={styles.controls}>
          <button
            className={styles.primaryBtn}
            onClick={handleProcessAll}
            disabled={loading}
          >
            {loading ? 'Processing...' : '▶ Process All Now'}
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={() => {
              setShowNewProject(!showNewProject);
              setEditingProject(null);
            }}
          >
            {showNewProject ? '✕ Cancel' : '+ Add Project'}
          </button>
        </section>

        {showNewProject && (
          <section className={styles.form}>
            <h3>New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={formData.nombre || ''}
              onChange={e =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Drive Account"
              value={formData.driveAccount || ''}
              onChange={e =>
                setFormData({ ...formData, driveAccount: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Input Folder ID"
              value={formData.inputFolderId || ''}
              onChange={e =>
                setFormData({ ...formData, inputFolderId: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Final Folder ID"
              value={formData.finalFolderId || ''}
              onChange={e =>
                setFormData({ ...formData, finalFolderId: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Review Folder ID"
              value={formData.reviewFolderId || ''}
              onChange={e =>
                setFormData({ ...formData, reviewFolderId: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Error Folder ID"
              value={formData.errorFolderId || ''}
              onChange={e =>
                setFormData({ ...formData, errorFolderId: e.target.value })
              }
            />
            <button className={styles.primaryBtn} onClick={handleAddProject}>
              Create Project
            </button>
          </section>
        )}

        <section className={styles.projects}>
          <h2>Projects ({projects.length})</h2>
          {projects.length === 0 ? (
            <p className={styles.empty}>No projects configured</p>
          ) : (
            <div className={styles.projectList}>
              {projects.map(project => (
                <div
                  key={project.nombre}
                  className={`${styles.projectCard} ${
                    project.activo ? styles.active : styles.inactive
                  }`}
                >
                  <div className={styles.projectHeader}>
                    <h3>{project.nombre}</h3>
                    <span className={styles.status}>
                      {project.activo ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>

                  <div className={styles.projectDetails}>
                    <p>
                      <strong>Account:</strong> {project.driveAccount}
                    </p>
                    <p>
                      <strong>Input:</strong> {project.inputFolderId}
                    </p>
                  </div>

                  <div className={styles.projectActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleProcessProject(project.nombre)}
                      disabled={loading}
                    >
                      Process
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleToggleProject(project.nombre)}
                    >
                      {project.activo ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setEditingProject(project.nombre);
                        setFormData(project);
                        setShowNewProject(false);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => handleDeleteProject(project.nombre)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {results.length > 0 && (
          <section className={styles.results}>
            <h2>Last Execution Results</h2>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`${styles.resultCard} ${
                  result.success ? styles.success : styles.error
                }`}
              >
                <h3>{result.projectName}</h3>
                <div className={styles.resultGrid}>
                  <div>
                    <strong>Videos Found:</strong> {result.videosFound}
                  </div>
                  <div>
                    <strong>Processed:</strong> {result.videosProcessed}
                  </div>
                  <div>
                    <strong>Moved:</strong> {result.videosMoved}
                  </div>
                  <div>
                    <strong>Review:</strong> {result.videosReview}
                  </div>
                  <div>
                    <strong>Error:</strong> {result.videosError}
                  </div>
                  <div>
                    <strong>Duration:</strong>{' '}
                    {(result.duration / 1000).toFixed(2)}s
                  </div>
                </div>
                <p className={styles.message}>{result.message}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          VideoFlow © 2024 | Automated video processing powered by OpenAI &
          Google Drive
        </p>
      </footer>
    </div>
  );
}
