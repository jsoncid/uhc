/**
 * Database List Component
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
      <Badge variant="outline" className="font-mono text-xs">
        {option?.label || dbType}
      </Badge>
    );
  };

  // Get badge for system type
  const getSystemTypeBadge = (systemType: string) => {
    const option = SYSTEM_TYPE_OPTIONS.find(o => o.value === systemType?.toLowerCase());
    const isIhomis = systemType?.toLowerCase() === 'ihomis';
    
    return (
      <Badge variant={isIhomis ? 'default' : 'secondary'}>
        {option?.label || systemType}
      </Badge>
    );
  };

  // Get status indicator
  const getStatusIndicator = (db: DatabaseConnection) => {
    if (!db.status) {
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs">Inactive</span>
        </div>
      );
    }

    const status = db.connection_status;
    
    if (status === 'connected') {
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs">Connected</span>
        </div>
      );
    }
    
    if (status === 'failed') {
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs">Failed</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-yellow-600">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-xs">Active</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connections
            </CardTitle>
            <CardDescription className="text-sm">
              View and manage all database connections. {databases.length} {databases.length === 1 ? 'database' : 'databases'} configured.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshPools}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh Pools</span>
            </Button>
            {onAddNew && (
              <Button size="sm" onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
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
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Database Connections</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get started by adding your first hospital database connection.
            </p>
            {onAddNew && (
              <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Database
              </Button>
            )}
          </div>
        )}

        {/* Database Table */}
        {!isLoading && databases.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow key={db.id} className={!db.status ? 'opacity-60' : ''}>
                    <TableCell>
                      {getStatusIndicator(db)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{db.description || db.db_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{db.db_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Server className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs">{db.host}:{db.port}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getDbTypeBadge(db.db_type)}</TableCell>
                    <TableCell>{getSystemTypeBadge(db.system_type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{db.facility_code || '-'}</span>
                        </div>
                        {db.region && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{db.region}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>
                {databases.filter(d => d.status).length} active / {databases.length} total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {databases.filter(d => d.connection_status === 'connected').length} connected
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
