import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { userService } from '@/services/userService';

interface UserWithStatus {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const UserAcceptanceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userToReject, setUserToReject] = useState<UserWithStatus | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get pending users from the database function
      const data = await userService.getPendingUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await userService.approveUser(userId);
      // Remove the approved user from the list
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error approving user:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (user: UserWithStatus) => {
    setUserToReject(user);
    setIsRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setUserToReject(null);
    setIsRejectDialogOpen(false);
  };

  const handleReject = async () => {
    if (!userToReject) return;
    
    setProcessingId(userToReject.id);
    try {
      await userService.rejectUser(userToReject.id);
      // Remove the rejected user from the list
      setUsers(users.filter(user => user.id !== userToReject.id));
      closeRejectDialog();
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Pending User Requests
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pending users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No pending user requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outlineSuccess">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outlineWarning">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                         
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            disabled={processingId === user.id}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            {processingId === user.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button 
                            variant="outlineerror" 
                            size="sm"
                            onClick={() => openRejectDialog(user)}
                            disabled={processingId === user.id}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
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

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Rejection
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this user? This action will permanently delete the user account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToReject && (
            <div className="py-4">
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm"><strong>Name:</strong> {userToReject.name}</p>
                <p className="text-sm"><strong>Email:</strong> {userToReject.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId !== null ? 'Rejecting...' : 'Reject User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
