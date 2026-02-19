import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { moduleService } from '@/services/moduleService'
import { Database } from '@/lib/supabase'
import { ModuleDialog } from './ModuleDialog'

type Module = Database['module3']['Tables']['module']['Row']

export const ModuleList = () => {
  const [modules, setModules] = useState<Module[]>([])
  const [filteredModules, setFilteredModules] = useState<Module[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchModules = async () => {
    try {
      setIsLoading(true)
      const data = await moduleService.getAllModules()
      setModules(data)
      setFilteredModules(data)
    } catch (err) {
      setError('Failed to fetch modules')
      console.error('Error fetching modules:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = modules.filter(module =>
        module.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredModules(filtered)
    } else {
      setFilteredModules(modules)
    }
  }, [searchTerm, modules])

  const handleEdit = (module: Module) => {
    setSelectedModule(module)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (module: Module) => {
    setDeleteTarget(module)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await moduleService.deleteModule(deleteTarget.id)
      await fetchModules()
      closeDeleteDialog()
    } catch (err) {
      setError('Failed to delete module')
      console.error('Error deleting module:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedModule(null)
    fetchModules()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate stats
  const totalModules = modules.length
  const activeModules = modules.filter(m => m.is_active).length
  const inactiveModules = totalModules - activeModules

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Modules</p>
            <p className="text-3xl font-semibold">
              {isLoading ? '...' : totalModules}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Modules</p>
            <p className="text-3xl font-semibold text-emerald-500">
              {isLoading ? '...' : activeModules}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Inactive Modules</p>
            <p className="text-3xl font-semibold text-amber-500">
              {isLoading ? '...' : inactiveModules}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Module Management</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No modules found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.id}</TableCell>
                      <TableCell>{module.description || 'No description'}</TableCell>
                      <TableCell>
                        <Badge variant={module.is_active ? 'default' : 'secondary'}>
                          {module.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(module.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(module)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ModuleDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        module={selectedModule}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete module "{deleteTarget?.id}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
