/**
 * Database Management View - Module 3
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
} from 'lucide-react';

import { DatabaseConnectionForm, DatabaseList } from 'src/components/apps/database';
import { Module3PageHeader } from './components';

const DatabaseManagement = () => {
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
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Module3PageHeader
          icon={Database}
          title="Database Management"
          description="Configure and manage connections to hospital database systems"
        />
      </div>

      {/* Info Alert */}
      <Alert className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm leading-relaxed ml-1">
          <strong className="text-base font-semibold text-blue-900 dark:text-blue-100">Dynamic Database Connections</strong>
          <br />
          <span className="block mt-2 text-blue-800/90 dark:text-blue-200/80">
            Add database credentials through this interface. All connections are stored securely in Supabase.
            Always use <strong className="font-semibold">Test Connection</strong> before saving to verify your credentials.
          </span>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <DatabaseList 
        onAddNew={handleAddNew}
        refreshTrigger={refreshTrigger}
      />

      {/* Add Database Dialog */}
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
      <Card className="mt-10 shadow-sm border-muted/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Guide</CardTitle>
          <CardDescription className="text-sm">Learn how to add and manage database connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 transition-all hover:shadow-md hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                <h4 className="font-semibold text-base">Add Database</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click <strong className="text-foreground">Add Database</strong> and enter your connection details: host, port, 
                username, password, and database name. Choose your system type (iHOMIS or iClinic).
              </p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 transition-all hover:shadow-md hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                <h4 className="font-semibold text-base">Test Connection</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Before saving, click <strong className="text-foreground">Test Connection</strong> to verify your credentials 
                are correct. This prevents invalid connections from being saved.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 transition-all hover:shadow-md hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                <h4 className="font-semibold text-base">Manage Connections</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Toggle connections on/off as needed. Only active databases are used in patient searches. 
                Click <strong className="text-foreground">Refresh Pools</strong> to apply changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManagement;
