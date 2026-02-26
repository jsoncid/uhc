/**
 * Database List Component - Module 3
 * 
 * Displays a list of configured database connections with:
 * - Status indicators (active/inactive, connection health)
 * - Toggle active/inactive functionality
 * - Delete functionality
 * - Database details display
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Switch } from 'src/components/ui/switch';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import {
  Database,
  Server,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Plus,
  Activity,
  Building2,
  MapPin,
} from 'lucide-react';
import databaseService, {
  DatabaseConnection,
  DB_TYPE_OPTIONS,
  SYSTEM_TYPE_OPTIONS,
} from 'src/services/databaseService';

interface DatabaseListProps {
  onAddNew?: () => void;
  refreshTrigger?: number;
}

export function DatabaseList({ onAddNew, refreshTrigger }: DatabaseListProps) {
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<DatabaseConnection | null>(null);

  // Load databases
  const loadDatabases = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await databaseService.getAllDatabases();
      
      if (result.success) {
        setDatabases(result.databases);
      } else {
        setError(result.message || 'Failed to load databases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load databases');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh when trigger changes
  useEffect(() => {
    loadDatabases();
  }, [refreshTrigger]);

  // Refresh pools
  const handleRefreshPools = async () => {
    setIsRefreshing(true);
    
    try {
      const result = await databaseService.refreshPools();
      
      if (result.success) {
        // Reload the list to get updated connection statuses
        await loadDatabases();
      } else {
        setError(result.message || 'Failed to refresh pools');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh pools');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle database status
  const handleToggleStatus = async (db: DatabaseConnection) => {
    if (!db.id) return;
    
    setTogglingId(db.id);
    
    try {
      const result = await databaseService.toggleDatabaseStatus(db.id);
      
      if (result.success) {
        // Update local state
        setDatabases(prev => 
          prev.map(d => d.id === db.id ? { ...d, status: result.data?.new_status ?? !d.status } : d)
        );
        // Refresh pools after status change
        await databaseService.refreshPools();
      } else {
        setError(result.message || 'Failed to toggle status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (db: DatabaseConnection) => {
    setSelectedForDelete(db);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedForDelete?.id) return;
    
    setDeletingId(selectedForDelete.id);
    
    try {
      const result = await databaseService.deleteDatabase(selectedForDelete.id);
      
      if (result.success) {
        // Remove from local state
        setDatabases(prev => prev.filter(d => d.id !== selectedForDelete.id));
        setDeleteDialogOpen(false);
        setSelectedForDelete(null);
        // Refresh pools after deletion
        await databaseService.refreshPools();
      } else {
        setError(result.message || 'Failed to delete database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete database');
    } finally {
      setDeletingId(null);
    }
  };

  // Get badge for database type
  const getDbTypeBadge = (dbType: string) => {
    const option = DB_TYPE_OPTIONS.find(o => o.value === dbType);
    return (
      <Badge variant="outline" className="font-mono text-xs font-medium px-2.5 py-0.5">
        {option?.label || dbType}
      </Badge>
    );
  };

  // Get badge for system type
  const getSystemTypeBadge = (systemType: string) => {
    const option = SYSTEM_TYPE_OPTIONS.find(o => o.value === systemType?.toLowerCase());
    const isIhomis = systemType?.toLowerCase() === 'ihomis';
    
    return (
      <Badge 
        variant={isIhomis ? 'default' : 'secondary'} 
        className={`font-medium px-2.5 py-1 ${isIhomis ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
      >
        {option?.label || systemType}
      </Badge>
    );
  };

  // Get status indicator
  const getStatusIndicator = (db: DatabaseConnection) => {
    if (!db.status) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          </div>
          <span className="text-xs font-medium">Inactive</span>
        </div>
      );
    }

    const status = db.connection_status;
    
    if (status === 'connected') {
      return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 opacity-50 blur-sm" />
          </div>
          <span className="text-xs font-semibold">Connected</span>
        </div>
      );
    }
    
    if (status === 'failed') {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <span className="text-xs font-semibold">Failed</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        </div>
        <span className="text-xs font-semibold">Active</span>
      </div>
    );
  };

  return (
    <Card className="shadow-sm border-muted/40">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2.5 text-xl">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              Database Connections
            </CardTitle>
            <CardDescription className="text-sm mt-1.5">
              View and manage all database connections. <strong className="text-foreground font-medium">{databases.length}</strong> {databases.length === 1 ? 'database' : 'databases'} configured.
            </CardDescription>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshPools}
              disabled={isRefreshing}
              className="gap-2 hover:bg-accent transition-colors"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Pools</span>
            </Button>
            {onAddNew && (
              <Button size="sm" onClick={onAddNew} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Add Database
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading databases...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && databases.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
              <Database className="h-14 w-14 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Database Connections</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Get started by adding your first hospital database connection to enable patient data access.
            </p>
            {onAddNew && (
              <Button onClick={onAddNew} size="lg" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Add Your First Database
              </Button>
            )}
          </div>
        )}

        {/* Database Table */}
        {!isLoading && databases.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[100px] font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Database</TableHead>
                  <TableHead className="font-semibold">Connection</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">System</TableHead>
                  <TableHead className="font-semibold">Facility</TableHead>
                  <TableHead className="w-[100px] font-semibold">Active</TableHead>
                  <TableHead className="w-[80px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow key={db.id} className={`transition-all ${!db.status ? 'opacity-60 hover:opacity-80' : 'hover:bg-muted/30'}`}>
                    <TableCell className="py-4">
                      {getStatusIndicator(db)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">{db.description || db.db_name}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded w-fit">{db.db_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Server className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs bg-muted/30 px-2 py-1 rounded">{db.host}:{db.port}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getDbTypeBadge(db.db_type)}</TableCell>
                    <TableCell className="py-4">{getSystemTypeBadge(db.system_type)}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{db.facility_code || '-'}</span>
                        </div>
                        {db.region && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{db.region}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={db.status}
                          onCheckedChange={() => handleToggleStatus(db)}
                          disabled={togglingId === db.id}
                        />
                        {togglingId === db.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDeleteClick(db)}
                        disabled={deletingId === db.id}
                      >
                        {deletingId === db.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Connection Stats */}
        {!isLoading && databases.length > 0 && (
          <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">
                <strong className="text-foreground">{databases.filter(d => d.status).length}</strong>
                <span className="text-muted-foreground"> active / </span>
                <strong className="text-foreground">{databases.length}</strong>
                <span className="text-muted-foreground"> total</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium">
                <strong className="text-green-700 dark:text-green-300">{databases.filter(d => d.connection_status === 'connected').length}</strong>
                <span className="text-green-600/80 dark:text-green-400/80"> connected</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Database Connection
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete <strong>{selectedForDelete?.description || selectedForDelete?.db_name}</strong>?
              <br />
              <span className="block mt-2 text-muted-foreground">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default DatabaseList;
