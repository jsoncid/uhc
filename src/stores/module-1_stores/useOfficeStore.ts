import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const module1 = supabase.schema('module1')

export interface Window {
  id: number
  created_at: string
  office: string
  description: string | null
  status: boolean
}

export interface Office {
  id: string
  created_at: string
  assignment: string
  status: boolean
  description: string | null
  windows?: Window[]
}

interface OfficeState {
  offices: Office[]
  isLoading: boolean
  error: string | null
  
  fetchOffices: (assignmentId?: string) => Promise<void>
  addOffice: (assignmentId: string, description: string, windowDescriptions: string[]) => Promise<void>
  deleteOffice: (officeId: string) => Promise<void>
  clearError: () => void
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  offices: [],
  isLoading: false,
  error: null,

  fetchOffices: async (assignmentId?: string) => {
    set({ isLoading: true, error: null })
    try {
      let query = module1
        .from('office')
        .select('*')
        .order('created_at', { ascending: false })

      if (assignmentId) {
        query = query.eq('assignment', assignmentId)
      }

      const { data: officesData, error: officesError } = await query

      if (officesError) throw officesError

      if (!officesData || officesData.length === 0) {
        set({ offices: [], isLoading: false })
        return
      }

      const officeIds = officesData.map((o) => o.id)
      const { data: windowsData, error: windowsError } = await module1
        .from('window')
        .select('*')
        .in('office', officeIds)

      if (windowsError) throw windowsError

      const officesWithWindows: Office[] = officesData.map((office) => ({
        ...office,
        windows: windowsData?.filter((w) => w.office === office.id) || [],
      }))

      set({ offices: officesWithWindows, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch offices',
        isLoading: false,
      })
    }
  },

  addOffice: async (assignmentId: string, description: string, windowDescriptions: string[]) => {
    set({ isLoading: true, error: null })
    try {
      const { data: officeData, error: officeError } = await module1
        .from('office')
        .insert({
          assignment: assignmentId,
          description,
          status: true,
        })
        .select()
        .single()

      if (officeError) throw officeError

      if (windowDescriptions.length > 0) {
        const windowInserts = windowDescriptions.map((desc) => ({
          office: officeData.id,
          description: desc,
          status: true,
        }))

        const { error: windowError } = await module1
          .from('window')
          .insert(windowInserts)

        if (windowError) throw windowError
      }

      await get().fetchOffices(assignmentId)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add office',
        isLoading: false,
      })
    }
  },

  deleteOffice: async (officeId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error: windowDeleteError } = await module1
        .from('window')
        .delete()
        .eq('office', officeId)

      if (windowDeleteError) throw windowDeleteError

      const { error: officeDeleteError } = await module1
        .from('office')
        .delete()
        .eq('id', officeId)

      if (officeDeleteError) throw officeDeleteError

      set((state) => ({
        offices: state.offices.filter((o) => o.id !== officeId),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete office',
        isLoading: false,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
