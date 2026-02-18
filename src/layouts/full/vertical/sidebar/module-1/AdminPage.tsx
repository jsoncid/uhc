import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { AddOfficeDialog } from './AddOfficeDialog';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { userService } from '@/services/userService';

interface Assignment {
  id: string;
  description: string;
}

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Admin Page' }];

const AdminPage = () => {
  const { offices, isLoading, error, fetchOffices, deleteOffice } = useOfficeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userAssignment, setUserAssignment] = useState<Assignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  useEffect(() => {
    const loadUserAssignment = async () => {
      try {
        setLoadingAssignment(true);
        const profile = await userService.getCurrentUserProfile();
        if (profile && profile.assignments.length > 0) {
          setUserAssignment(profile.assignments[0]);
        }
      } catch (err) {
        console.error('Failed to load user assignment:', err);
      } finally {
        setLoadingAssignment(false);
      }
    };
    loadUserAssignment();
  }, []);

  useEffect(() => {
    if (userAssignment) {
      fetchOffices(userAssignment.id);
    }
  }, [userAssignment, fetchOffices]);

  const handleDeleteOffice = async (id: string) => {
    if (confirm('Are you sure you want to remove this office?')) {
      await deleteOffice(id);
    }
  };

  const handleRefresh = () => {
    if (userAssignment) {
      fetchOffices(userAssignment.id);
    }
  };

  const filteredOffices = offices.filter((office) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      (office.description?.toLowerCase().includes(lower) ?? false) ||
      (office.windows?.some((w) => w.description?.toLowerCase().includes(lower)) ?? false)
    );
  });

  return (
    <>
      <BreadcrumbComp title="Admin Page" items={BCrumb} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Office Management
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Office
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userAssignment && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Assignment: </span>
                <span className="text-sm font-medium">{userAssignment.description}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offices..."
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
                    <TableHead>Office Name</TableHead>
                    <TableHead>Windows</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAssignment || isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {loadingAssignment ? 'Loading user assignment...' : 'Loading offices...'}
                      </TableCell>
                    </TableRow>
                  ) : !userAssignment ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No assignment found for your account. Please contact administrator.
                      </TableCell>
                    </TableRow>
                  ) : filteredOffices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm
                          ? 'No offices match your search'
                          : 'No offices found. Click "Add Office" to get started.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOffices.map((office) => (
                      <TableRow key={office.id}>
                        <TableCell className="font-medium">{office.description || 'Unnamed Office'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {office.windows?.map((w) => (
                              <Badge key={w.id} variant="secondary">
                                {w.description || `Window ${w.id}`}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(office.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOffice(office.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AddOfficeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          assignmentId={userAssignment?.id || ''}
          onSuccess={handleRefresh}
        />
      </div>
    </>
  );
};

export default AdminPage;
