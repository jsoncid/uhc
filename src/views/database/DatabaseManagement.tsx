/**
 * Database Management View
 * 
 * Main page for managing dynamic database connections.
 * Features:
 * - List of all configured databases
 * - Add new database form
 * - Toggle active/inactive status
 * - Delete databases
 * - Refresh connection pools
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import {
  Database,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DatabaseConnectionForm, DatabaseList } from 'src/components/database';

const DatabaseManagement = () => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Handle successful database addition
  const handleAddSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowAddDialog(false);
  };

  // Handle add new button click
  const handleAddNew = () => {
    setShowAddDialog(true);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Database Management</h1>
            <p className="text-muted-foreground">
              Configure and manage dynamic database connections for patient data
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Dynamic Database Connections:</strong> Add database credentials through this UI.
          Connections are stored securely in Supabase, not hardcoded. 
          Use <strong>Test Connection</strong> before saving to verify credentials work.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <DatabaseList 
        onAddNew={handleAddNew}
        refreshTrigger={refreshTrigger}
      />

      {/* Add Database Dialog (alternative to tab) */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Add New Database Connection
            </DialogTitle>
          </DialogHeader>
          <DatabaseConnectionForm 
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Footer Help */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Quick Guide</CardTitle>
          <CardDescription>How to use dynamic database connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">1. Add Database</h4>
              <p className="text-sm text-muted-foreground">
                Enter your database credentials (host, port, username, password, database name).
                Select the system type (iHOMIS or iClinic).
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">2. Test Connection</h4>
              <p className="text-sm text-muted-foreground">
                Click "Test Connection" to verify the credentials work before saving.
                This ensures valid connections only.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">3. Manage & Use</h4>
              <p className="text-sm text-muted-foreground">
                Toggle databases active/inactive. Active databases are included in patient searches.
                Use "Refresh Pools" after changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManagement;
