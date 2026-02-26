import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Building2, RefreshCw, Pencil, Users, Tag, ListChecks, ClipboardList } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { AddOfficeDialog } from './AddOfficeDialog';
import { EditOfficeDialog } from './EditOfficeDialog';
import { AssignUserToOfficeDialog } from './AssignUserToOfficeDialog';
import { EditUserOfficeAssignmentDialog } from './EditUserOfficeAssignmentDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useOfficeStore, type Office } from '@/stores/module-1_stores/useOfficeStore';
import {
  useOfficeUserAssignmentStore,
  type OfficeUserAssignment,
} from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useQueueStore, type Priority, type Status } from '@/stores/module-1_stores/useQueueStore';
import { userService } from '@/services/userService';

interface Assignment {
  id: string;
  description: string;
}

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Admin Page' }];

const AdminPage = () => {
  const { offices, isLoading, error, fetchOffices, deleteOffice } = useOfficeStore();
  const {
    assignments: officeUserAssignments,
    isLoading: isLoadingUserAssignments,
    error: userAssignmentError,
    fetchOfficeUserAssignments,
    removeUserFromOffice,
  } = useOfficeUserAssignmentStore();
  const {
    sequences,
    allPriorities,
    statuses,
    isLoading: isLoadingPriorities,
    error: priorityError,
    fetchAllSequencesForLogs,
    fetchAllPriorities,
    addPriority,
    updatePriority,
    deletePriority,
    fetchStatuses,
    addStatus,
    updateStatus,
    deleteStatus,
  } = useQueueStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userAssignmentSearchTerm, setUserAssignmentSearchTerm] = useState('');
  const [prioritySearchTerm, setPrioritySearchTerm] = useState('');
  const [statusSearchTerm, setStatusSearchTerm] = useState('');
  const [queueLogsSearchTerm, setQueueLogsSearchTerm] = useState('');
  
  // Queue logs filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterOffice, setFilterOffice] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [isEditUserAssignmentDialogOpen, setIsEditUserAssignmentDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [editingUserAssignment, setEditingUserAssignment] = useState<OfficeUserAssignment | null>(null);
  const [userAssignment, setUserAssignment] = useState<Assignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  // Priority type states
  const [newPriorityName, setNewPriorityName] = useState('');
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [editPriorityName, setEditPriorityName] = useState('');

  // Status type states
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editStatusName, setEditStatusName] = useState('');

  // Delete confirmation states
  const [deleteOfficeConfirm, setDeleteOfficeConfirm] = useState<{ isOpen: boolean; office: Office | null }>({
    isOpen: false,
    office: null,
  });
  const [deleteUserAssignmentConfirm, setDeleteUserAssignmentConfirm] = useState<{
    isOpen: boolean;
    assignment: OfficeUserAssignment | null;
  }>({
    isOpen: false,
    assignment: null,
  });
  const [deletePriorityConfirm, setDeletePriorityConfirm] = useState<{
    isOpen: boolean;
    priority: Priority | null;
  }>({
    isOpen: false,
    priority: null,
  });
  const [deleteStatusConfirm, setDeleteStatusConfirm] = useState<{
    isOpen: boolean;
    status: Status | null;
  }>({
    isOpen: false,
    status: null,
  });

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
      fetchOfficeUserAssignments(userAssignment.id);
    }
  }, [userAssignment, fetchOffices, fetchOfficeUserAssignments]);

  useEffect(() => {
    fetchAllPriorities();
    fetchStatuses();
    fetchAllSequencesForLogs();
  }, [fetchAllPriorities, fetchStatuses, fetchAllSequencesForLogs]);

  const handleDeleteOfficeClick = (office: Office) => {
    setDeleteOfficeConfirm({ isOpen: true, office });
  };

  const handleConfirmDeleteOffice = async () => {
    if (deleteOfficeConfirm.office) {
      await deleteOffice(deleteOfficeConfirm.office.id);
      setDeleteOfficeConfirm({ isOpen: false, office: null });
    }
  };

  const handleEditOffice = (office: Office) => {
    setEditingOffice(office);
    setIsEditDialogOpen(true);
  };

  const handleRefresh = () => {
    if (userAssignment) {
      fetchOffices(userAssignment.id);
    }
  };

  const handleRefreshUserAssignments = () => {
    if (userAssignment) {
      fetchOfficeUserAssignments(userAssignment.id);
    }
  };

  const handleRemoveUserFromOfficeClick = (assignment: OfficeUserAssignment) => {
    setDeleteUserAssignmentConfirm({ isOpen: true, assignment });
  };

  const handleConfirmRemoveUserFromOffice = async () => {
    if (deleteUserAssignmentConfirm.assignment) {
      await removeUserFromOffice(deleteUserAssignmentConfirm.assignment.id);
      setDeleteUserAssignmentConfirm({ isOpen: false, assignment: null });
    }
  };

  const handleEditUserAssignment = (assignment: OfficeUserAssignment) => {
    setEditingUserAssignment(assignment);
    setIsEditUserAssignmentDialogOpen(true);
  };

  const filteredOffices = offices.filter((office) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      (office.description?.toLowerCase().includes(lower) ?? false) ||
      (office.windows?.some((w) => w.description?.toLowerCase().includes(lower)) ?? false)
    );
  });

  const filteredUserAssignments = officeUserAssignments.filter((assignment) => {
    if (!userAssignmentSearchTerm) return true;
    const lower = userAssignmentSearchTerm.toLowerCase();
    return (
      (assignment.user_email?.toLowerCase().includes(lower) ?? false) ||
      (assignment.office_description?.toLowerCase().includes(lower) ?? false)
    );
  });

  const filteredPriorities = allPriorities.filter((priority) => {
    if (!prioritySearchTerm) return true;
    const lower = prioritySearchTerm.toLowerCase();
    return priority.description?.toLowerCase().includes(lower) ?? false;
  });

  const handleAddPriority = async () => {
    if (!newPriorityName.trim()) return;
    await addPriority(newPriorityName.trim());
    setNewPriorityName('');
  };

  const handleEditPriority = (priority: Priority) => {
    setEditingPriority(priority);
    setEditPriorityName(priority.description || '');
  };

  const handleSaveEditPriority = async () => {
    if (!editingPriority || !editPriorityName.trim()) return;
    await updatePriority(editingPriority.id, editPriorityName.trim(), editingPriority.status);
    setEditingPriority(null);
    setEditPriorityName('');
  };

  const handleCancelEditPriority = () => {
    setEditingPriority(null);
    setEditPriorityName('');
  };

  const handleTogglePriorityStatus = async (priority: Priority) => {
    await updatePriority(priority.id, priority.description || '', !priority.status);
  };

  const handleDeletePriorityClick = (priority: Priority) => {
    setDeletePriorityConfirm({ isOpen: true, priority });
  };

  const handleConfirmDeletePriority = async () => {
    if (deletePriorityConfirm.priority) {
      await deletePriority(deletePriorityConfirm.priority.id);
      setDeletePriorityConfirm({ isOpen: false, priority: null });
    }
  };

  const handleRefreshPriorities = () => {
    fetchAllPriorities();
  };

  // Status handlers
  const filteredStatuses = statuses.filter((status) => {
    if (!statusSearchTerm) return true;
    const lower = statusSearchTerm.toLowerCase();
    return status.description?.toLowerCase().includes(lower) ?? false;
  });

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await addStatus(newStatusName.trim());
    setNewStatusName('');
  };

  const handleEditStatus = (status: Status) => {
    setEditingStatus(status);
    setEditStatusName(status.description || '');
  };

  const handleSaveEditStatus = async () => {
    if (!editingStatus || !editStatusName.trim()) return;
    await updateStatus(editingStatus.id, editStatusName.trim(), editingStatus.is_active);
    setEditingStatus(null);
    setEditStatusName('');
  };

  const handleCancelEditStatus = () => {
    setEditingStatus(null);
    setEditStatusName('');
  };

  const handleToggleStatusStatus = async (status: Status) => {
    await updateStatus(status.id, status.description || '', !status.is_active);
  };

  const handleDeleteStatusClick = (status: Status) => {
    setDeleteStatusConfirm({ isOpen: true, status });
  };

  const handleConfirmDeleteStatus = async () => {
    if (deleteStatusConfirm.status) {
      await deleteStatus(deleteStatusConfirm.status.id);
      setDeleteStatusConfirm({ isOpen: false, status: null });
    }
  };

  const handleRefreshStatuses = () => {
    fetchStatuses();
  };

  // Queue logs handlers
  const filteredQueueLogs = sequences
    .filter((sequence) => {
      // Text search filter
      if (queueLogsSearchTerm) {
        const lower = queueLogsSearchTerm.toLowerCase();
        const matchesSearch = (
          (sequence.queue_data?.code?.toLowerCase().includes(lower) ?? false) ||
          (sequence.office_data?.description?.toLowerCase().includes(lower) ?? false) ||
          (sequence.status_data?.description?.toLowerCase().includes(lower) ?? false) ||
          (sequence.priority_data?.description?.toLowerCase().includes(lower) ?? false)
        );
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filterStatus !== 'all' && sequence.status !== filterStatus) {
        return false;
      }
      
      // Priority filter
      if (filterPriority !== 'all' && sequence.priority !== filterPriority) {
        return false;
      }
      
      // Office filter
      if (filterOffice !== 'all' && sequence.office !== filterOffice) {
        return false;
      }
      
      // Active/Inactive filter
      if (filterActive === 'active' && !sequence.is_active) {
        return false;
      }
      if (filterActive === 'inactive' && sequence.is_active) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'code-asc':
          return (a.queue_data?.code || '').localeCompare(b.queue_data?.code || '');
        case 'code-desc':
          return (b.queue_data?.code || '').localeCompare(a.queue_data?.code || '');
        case 'office':
          return (a.office_data?.description || '').localeCompare(b.office_data?.description || '');
        default:
          return 0;
      }
    });

  const handleRefreshQueueLogs = () => {
    fetchAllSequencesForLogs();
  };

  const handleClearFilters = () => {
    setQueueLogsSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterOffice('all');
    setFilterActive('all');
    setSortBy('date-desc');
  };

  // Get unique offices from sequences for filter
  const uniqueOffices = Array.from(
    new Map(sequences.map(s => [s.office, s.office_data])).values()
  ).filter(Boolean);

  return (
    <>
      <BreadcrumbComp title="Admin Page" items={BCrumb} />

      <Tabs defaultValue="offices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="offices">Office Management</TabsTrigger>
          <TabsTrigger value="user-assignment">Office User Assignment</TabsTrigger>
          <TabsTrigger value="priority-types">Priority Types</TabsTrigger>
          <TabsTrigger value="status-types">Status Types</TabsTrigger>
          <TabsTrigger value="queue-logs">Queue Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="offices">
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
                          <TableCell className="font-medium">
                            {office.description || 'Unnamed Office'}
                          </TableCell>
                          <TableCell>
                            {office.windows?.length || 0}
                          </TableCell>
                          <TableCell>{new Date(office.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOffice(office)}
                                disabled={isLoading}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteOfficeClick(office)}
                                disabled={isLoading}
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
        </TabsContent>

        <TabsContent value="user-assignment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Office User Assignment
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefreshUserAssignments} disabled={isLoadingUserAssignments}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUserAssignments ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setIsAssignUserDialogOpen(true)} disabled={!userAssignment || offices.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign User
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
                  placeholder="Search by user or office..."
                  value={userAssignmentSearchTerm}
                  onChange={(e) => setUserAssignmentSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {userAssignmentError && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {userAssignmentError}
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Assigned At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAssignment || isLoadingUserAssignments ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {loadingAssignment ? 'Loading user assignment...' : 'Loading office user assignments...'}
                        </TableCell>
                      </TableRow>
                    ) : !userAssignment ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No assignment found for your account. Please contact administrator.
                        </TableCell>
                      </TableRow>
                    ) : offices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No offices found. Please create offices first in the Office Management tab.
                        </TableCell>
                      </TableRow>
                    ) : filteredUserAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {userAssignmentSearchTerm
                            ? 'No user assignments match your search'
                            : 'No users assigned to offices yet. Click "Assign User" to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUserAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.user_email || 'Unknown User'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{assignment.office_description || 'Unnamed Office'}</Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.window_description || <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell>{new Date(assignment.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUserAssignment(assignment)}
                                disabled={isLoadingUserAssignments}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUserFromOfficeClick(assignment)}
                                disabled={isLoadingUserAssignments}
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
        </TabsContent>

        <TabsContent value="priority-types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Priority Types
                </CardTitle>
                <Button variant="outline" onClick={handleRefreshPriorities} disabled={isLoadingPriorities}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPriorities ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="New priority type name..."
                  value={newPriorityName}
                  onChange={(e) => setNewPriorityName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                  className="max-w-sm"
                />
                <Button onClick={handleAddPriority} disabled={!newPriorityName.trim() || isLoadingPriorities}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Priority
                </Button>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search priority types..."
                  value={prioritySearchTerm}
                  onChange={(e) => setPrioritySearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {priorityError && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {priorityError}
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPriorities ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Loading priority types...
                        </TableCell>
                      </TableRow>
                    ) : filteredPriorities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {prioritySearchTerm
                            ? 'No priority types match your search'
                            : 'No priority types found. Add one above to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPriorities.map((priority) => (
                        <TableRow key={priority.id}>
                          <TableCell className="font-medium">
                            {editingPriority?.id === priority.id ? (
                              <Input
                                value={editPriorityName}
                                onChange={(e) => setEditPriorityName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditPriority();
                                  if (e.key === 'Escape') handleCancelEditPriority();
                                }}
                                className="max-w-xs"
                                autoFocus
                              />
                            ) : (
                              priority.description || 'Unnamed'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={priority.status}
                                onCheckedChange={() => handleTogglePriorityStatus(priority)}
                                disabled={isLoadingPriorities}
                              />
                              <Badge variant={priority.status ? 'default' : 'destructive'}>
                                {priority.status ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(priority.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {editingPriority?.id === priority.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveEditPriority}
                                    disabled={isLoadingPriorities}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEditPriority}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditPriority(priority)}
                                    disabled={isLoadingPriorities}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePriorityClick(priority)}
                                    disabled={isLoadingPriorities}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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
        </TabsContent>

        <TabsContent value="status-types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Status Types
                </CardTitle>
                <Button variant="outline" onClick={handleRefreshStatuses} disabled={isLoadingPriorities}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPriorities ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">
                  Status types define the state of a queue entry (e.g., Pending, Serving, Completed).
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="New status type name..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                  className="max-w-sm"
                />
                <Button onClick={handleAddStatus} disabled={!newStatusName.trim() || isLoadingPriorities}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search status types..."
                  value={statusSearchTerm}
                  onChange={(e) => setStatusSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPriorities ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Loading status types...
                        </TableCell>
                      </TableRow>
                    ) : filteredStatuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {statusSearchTerm
                            ? 'No status types match your search'
                            : 'No status types found. Add one above to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStatuses.map((status) => (
                        <TableRow key={status.id}>
                          <TableCell className="font-medium">
                            {editingStatus?.id === status.id ? (
                              <Input
                                value={editStatusName}
                                onChange={(e) => setEditStatusName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditStatus();
                                  if (e.key === 'Escape') handleCancelEditStatus();
                                }}
                                className="max-w-xs"
                                autoFocus
                              />
                            ) : (
                              <Badge variant="outline">{status.description || 'Unnamed'}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={status.is_active}
                                onCheckedChange={() => handleToggleStatusStatus(status)}
                                disabled={isLoadingPriorities}
                              />
                              <Badge variant={status.is_active ? 'default' : 'destructive'}>
                                {status.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(status.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {editingStatus?.id === status.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveEditStatus}
                                    disabled={isLoadingPriorities}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEditStatus}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditStatus(status)}
                                    disabled={isLoadingPriorities}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteStatusClick(status)}
                                    disabled={isLoadingPriorities}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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
        </TabsContent>

        <TabsContent value="queue-logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Queue Logs
                </CardTitle>
                <Button variant="outline" onClick={handleRefreshQueueLogs} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">
                  View all queue sequences and their status from the sequence table. Total records: {sequences.length} | Filtered: {filteredQueueLogs.length}
                </span>
              </div>

              <div className="space-y-4 mb-4">
                {/* Search Bar */}
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by queue code, office, status, or priority..."
                    value={queueLogsSearchTerm}
                    onChange={(e) => setQueueLogsSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.description || 'Unnamed'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Priority:</span>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {allPriorities.map((priority) => (
                          <SelectItem key={priority.id} value={priority.id}>
                            {priority.description || 'Unnamed'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Office:</span>
                    <Select value={filterOffice} onValueChange={setFilterOffice}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Offices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Offices</SelectItem>
                        {uniqueOffices.map((office) => (
                          <SelectItem key={office?.id} value={office?.id || ''}>
                            {office?.description || 'Unnamed'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Active:</span>
                    <Select value={filterActive} onValueChange={setFilterActive}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="code-asc">Queue Code (A-Z)</SelectItem>
                        <SelectItem value="code-desc">Queue Code (Z-A)</SelectItem>
                        <SelectItem value="office">Office (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="ml-auto"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue Code</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPriorities ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading queue logs...
                        </TableCell>
                      </TableRow>
                    ) : filteredQueueLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {queueLogsSearchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterOffice !== 'all' || filterActive !== 'all'
                            ? 'No queue logs match your filters'
                            : 'No queue logs found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQueueLogs.map((sequence) => (
                        <TableRow key={sequence.id}>
                          <TableCell className="font-medium">
                            <code className="text-sm font-mono">{sequence.queue_data?.code || 'N/A'}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sequence.office_data?.description || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>
                            {sequence.priority_data?.description || <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sequence.status_data?.is_active ? 'default' : 'secondary'}>
                              {sequence.status_data?.description || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sequence.window_data?.description || <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sequence.is_active ? 'default' : 'destructive'}>
                              {sequence.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(sequence.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddOfficeDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        assignmentId={userAssignment?.id || ''}
        onSuccess={handleRefresh}
      />

      <EditOfficeDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingOffice(null);
        }}
        office={editingOffice}
      />

      <AssignUserToOfficeDialog
        isOpen={isAssignUserDialogOpen}
        onClose={() => setIsAssignUserDialogOpen(false)}
        assignmentId={userAssignment?.id || ''}
        onSuccess={handleRefreshUserAssignments}
      />

      <EditUserOfficeAssignmentDialog
        isOpen={isEditUserAssignmentDialogOpen}
        onClose={() => {
          setIsEditUserAssignmentDialogOpen(false);
          setEditingUserAssignment(null);
        }}
        assignment={editingUserAssignment}
        onSuccess={handleRefreshUserAssignments}
      />

      <ConfirmDialog
        isOpen={deleteOfficeConfirm.isOpen}
        onClose={() => setDeleteOfficeConfirm({ isOpen: false, office: null })}
        onConfirm={handleConfirmDeleteOffice}
        title="Delete Office"
        description={`Are you sure you want to delete "${deleteOfficeConfirm.office?.description || 'this office'}"? This will also remove all windows and user assignments associated with this office. This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={deleteUserAssignmentConfirm.isOpen}
        onClose={() => setDeleteUserAssignmentConfirm({ isOpen: false, assignment: null })}
        onConfirm={handleConfirmRemoveUserFromOffice}
        title="Remove User from Office"
        description={`Are you sure you want to remove "${deleteUserAssignmentConfirm.assignment?.user_email || 'this user'}" from "${deleteUserAssignmentConfirm.assignment?.office_description || 'this office'}"?`}
        confirmText="Remove"
        isLoading={isLoadingUserAssignments}
      />

      <ConfirmDialog
        isOpen={deletePriorityConfirm.isOpen}
        onClose={() => setDeletePriorityConfirm({ isOpen: false, priority: null })}
        onConfirm={handleConfirmDeletePriority}
        title="Delete Priority Type"
        description={`Are you sure you want to delete the priority type "${deletePriorityConfirm.priority?.description || 'this priority'}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isLoadingPriorities}
      />

      <ConfirmDialog
        isOpen={deleteStatusConfirm.isOpen}
        onClose={() => setDeleteStatusConfirm({ isOpen: false, status: null })}
        onConfirm={handleConfirmDeleteStatus}
        title="Delete Status Type"
        description={`Are you sure you want to delete the status type "${deleteStatusConfirm.status?.description || 'this status'}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isLoadingPriorities}
      />
    </>
  );
};

export default AdminPage;
