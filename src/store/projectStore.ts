import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { eventBus, safeEmit } from '../utils/eventBus'
import { ProjectSchema } from '../utils/validators'
import { checkStorageQuota } from '../utils/storageManager'
import { merge } from 'lodash-es'

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

export interface ProjectStoreResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  
  // Actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'modifiedAt'>) => ProjectStoreResult<Project>
  updateProject: (id: string, updates: Partial<Project>) => ProjectStoreResult<void>
  deleteProject: (id: string) => ProjectStoreResult<void>
  setCurrentProject: (project: Project | null) => void
  getProjectById: (id: string) => ProjectStoreResult<Project>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set, get) => ({
      projects: [],
      currentProject: null,

      createProject: (projectData) => {
        try {
          // Check storage quota before creating
          const quota = checkStorageQuota()
          if (quota.warning) {
            safeEmit('quotaWarning', { used: quota.used, limit: 5 * 1024 * 1024 })
          }

          const timestamp = new Date().toISOString()
          const newProject: Project = {
            ...projectData,
            id: `${Date.now()}-${crypto.randomUUID()}`, // Prefix with timestamp to avoid collisions
            createdAt: timestamp,
            modifiedAt: timestamp,
          }

          // Validate project data
          const validated = ProjectSchema.parse(newProject)

          set((draft) => {
            draft.projects.unshift(validated)
          })

          safeEmit('projectSwitched', validated.id)
          return { success: true, data: validated }
        } catch (error) {
          console.error('Failed to create project:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create project',
          }
        }
      },

      updateProject: (id, updates) => {
        try {
          const project = get().projects.find((p) => p.id === id)
          if (!project) {
            return { success: false, error: 'Project not found' }
          }

          // Use deep merge for nested updates
          const merged = merge({}, project, updates, {
            modifiedAt: new Date().toISOString(),
          })

          // Validate merged data
          const validated = ProjectSchema.parse(merged)

          set((draft) => {
            const index = draft.projects.findIndex((p) => p.id === id)
            if (index !== -1) {
              draft.projects[index] = validated
            }
            if (draft.currentProject?.id === id) {
              draft.currentProject = validated
            }
          })

          return { success: true }
        } catch (error) {
          console.error('Failed to update project:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update project',
          }
        }
      },

      deleteProject: (id) => {
        try {
          const exists = get().projects.some((p) => p.id === id)
          if (!exists) {
            return { success: false, error: 'Project not found' }
          }

          set((draft) => {
            draft.projects = draft.projects.filter((p) => p.id !== id)
            if (draft.currentProject?.id === id) {
              draft.currentProject = null
            }
          })

          // Notify other stores to reset their state
          safeEmit('projectDeleted', id)
          return { success: true }
        } catch (error) {
          console.error('Failed to delete project:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete project',
          }
        }
      },

      setCurrentProject: (project) => {
        set((draft) => {
          draft.currentProject = project
        })
        if (project) {
          safeEmit('projectSwitched', project.id)
        }
      },

      getProjectById: (id) => {
        const project = get().projects.find((p) => p.id === id)
        if (!project) {
          return { success: false, error: 'Project not found' }
        }
        return { success: true, data: project }
      },
    })),
    {
      name: 'genai-galaxy-projects',
      version: 1,
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate projects:', error)
          } else if (state) {
            // Check quota on load
            const quota = checkStorageQuota()
            if (quota.warning) {
              console.warn('Storage quota warning on rehydrate')
            }
          }
        }
      },
    }
  )
)

// Subscribe to cross-store events
eventBus.on('storeReset', (storeName) => {
  if (storeName === 'all' || storeName === 'projects') {
    useProjectStore.setState({ projects: [], currentProject: null })
  }
})
