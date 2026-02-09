import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProjectType = 'raster' | 'vector' | 'character' | 'story'

export interface Project {
  id: string
  name: string
  type: ProjectType
  thumbnail: string
  width: number
  height: number
  fps?: number
  createdAt: string
  modifiedAt: string
}

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  
  // Actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'modifiedAt'>) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (project: Project | null) => void
  getProjectById: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,

      createProject: (projectData) => {
        const newProject: Project = {
          ...projectData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        }

        set((state) => ({
          projects: [newProject, ...state.projects],
        }))

        return newProject
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, modifiedAt: new Date().toISOString() }
              : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, modifiedAt: new Date().toISOString() }
              : state.currentProject,
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }))
      },

      setCurrentProject: (project) => {
        set({ currentProject: project })
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id)
      },
    }),
    {
      name: 'genai-galaxy-projects',
    }
  )
)
