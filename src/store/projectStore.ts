import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { eventBus, safeEmit } from '../utils/eventBus'
import { ProjectSchema } from '../utils/validators'
import { checkStorageQuota, deleteFromIndexedDB } from '../utils/storageManager'
import { merge } from 'lodash-es'
import { deleteStory } from '../utils/storyDb'

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
  upsertProjectIndex: (entry: {
    id: string
    name: string
    type: ProjectType
    thumbnail: string
    width: number
    height: number
    fps?: number
  }) => ProjectStoreResult<void>
  deleteProject: (id: string) => Promise<ProjectStoreResult<void>>
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

      upsertProjectIndex: (entry) => {
        try {
          const existing = get().projects.find((p) => p.id === entry.id)
          const now = new Date().toISOString()
          if (existing) {
            const merged = merge({}, existing, { ...entry, modifiedAt: now })
            const validated = ProjectSchema.parse(merged)
            set((draft) => {
              const index = draft.projects.findIndex((p) => p.id === entry.id)
              if (index !== -1) {
                draft.projects[index] = validated
              }
            })
          } else {
            const newProject: Project = {
              ...entry,
              createdAt: now,
              modifiedAt: now,
            }
            const validated = ProjectSchema.parse(newProject)
            set((draft) => {
              draft.projects.unshift(validated)
            })
          }
          return { success: true }
        } catch (error) {
          console.error('Failed to upsert project index:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upsert project',
          }
        }
      },

      deleteProject: async (id) => {
        try {
          const project = get().projects.find((p) => p.id === id)
          if (!project) {
            return { success: false, error: 'Project not found' }
          }

          if (project.type === 'story') {
            try {
              await deleteStory(id)
            } catch (e) {
              console.error('Failed to delete story from IndexedDB:', e)
            }
          } else if (project.type === 'character') {
            try {
              localStorage.removeItem(`character-${id}`)
              await deleteFromIndexedDB(`character-${id}`)
            } catch (e) {
              console.error('Failed to delete character storage:', e)
            }
          }

          set((draft) => {
            draft.projects = draft.projects.filter((p) => p.id !== id)
            if (draft.currentProject?.id === id) {
              draft.currentProject = null
            }
          })

          safeEmit('projectDeleted', { id: project.id, type: project.type })
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
