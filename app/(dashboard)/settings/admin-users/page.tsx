// app/(dashboard)/settings/admin-users/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Search,
  MoreVertical,
  User,
  Mail,
  Calendar,
  Shield,
  Users as UsersIcon,
  RefreshCw,
  Phone,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { useAllUsers, useUpdateUserStatus } from '@/hooks/useAdmin';
import { TableSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import type { AdminUser, AdminUserStatus, AdminUserType, AdminAllUsersParams } from '@/types/admin';

const STATUS_OPTIONS: { value: AdminUserStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DELETED', label: 'Deleted' },
];

const USER_TYPE_OPTIONS: { value: AdminUserType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'admin', label: 'Admin' },
  { value: 'customer', label: 'Customer' },
  { value: 'instructor', label: 'Instructor' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | 'ALL'>('ALL');
  const [userTypeFilter, setUserTypeFilter] = useState<AdminUserType | 'ALL'>('ALL');
  const [searchParams, setSearchParams] = useState<AdminAllUsersParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  // Status update modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newStatus, setNewStatus] = useState<AdminUserStatus | ''>('');

  const { data: users, isLoading, error, refetch } = useAllUsers(searchParams);
  const { updateStatus, isLoading: isUpdating } = useUpdateUserStatus();

  // Filter users based on search term, status, and user type
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone_number && user.phone_number.includes(searchTerm));

      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      const matchesType = userTypeFilter === 'ALL' || user.user_type === userTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [users, searchTerm, statusFilter, userTypeFilter]);

  const handleSearch = () => {
    const params: AdminAllUsersParams = {
      ...searchParams,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    };
    setSearchParams(params);
    refetch(params);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openStatusModal = (user: AdminUser, status: AdminUserStatus) => {
    setSelectedUser(user);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser || !newStatus) return;

    try {
      await updateStatus(selectedUser.id, newStatus as AdminUserStatus);
      toast.success(`User status updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      setSelectedUser(null);
      setNewStatus('');
      refetch(searchParams);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const getStatusBadge = (status: AdminUserStatus) => {
    const statusConfig: Record<AdminUserStatus, { className: string; label: string }> = {
      'ACTIVE': { className: 'bg-green-100 text-green-800', label: 'Active' },
      'INACTIVE': { className: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'PENDING_VERIFICATION': { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'SUSPENDED': { className: 'bg-red-100 text-red-800', label: 'Suspended' },
      'DELETED': { className: 'bg-red-200 text-red-900', label: 'Deleted' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUserTypeBadge = (userType: AdminUserType) => {
    const typeConfig: Record<AdminUserType, { className: string; icon: React.ReactNode }> = {
      'admin': { className: 'text-blue-600', icon: <Shield className="w-3 h-3" /> },
      'customer': { className: 'text-green-600', icon: <User className="w-3 h-3" /> },
      'instructor': { className: 'text-purple-600', icon: <UserCheck className="w-3 h-3" /> },
    };

    const config = typeConfig[userType] || { className: 'text-gray-600', icon: <User className="w-3 h-3" /> };
    return (
      <div className={`flex items-center gap-1 ${config.className}`}>
        {config.icon}
        <span className="text-sm capitalize">{userType}</span>
      </div>
    );
  };

  return (
    <div className="px-6 space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AdminUserStatus | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={userTypeFilter}
                onValueChange={(value) => setUserTypeFilter(value as AdminUserType | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center">
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch(searchParams)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Link href="/settings/admin-users/create">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm">{error.message}</p>
          <button onClick={() => refetch(searchParams)} className="mt-2 text-sm underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading Skeleton */}
          {isLoading && users.length === 0 && (
            <TableSkeleton rows={5} columns={8} />
          )}

          {/* Empty State */}
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          )}

          {/* Table with Data */}
          {!isLoading && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.full_name}</p>
                          {currentUser?.id === user.id.toString() && (
                            <p className="text-xs text-primary">(You)</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{user.phone_number || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUserTypeBadge(user.user_type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusModal(user, 'INACTIVE')}
                            disabled={currentUser?.id === user.id.toString() || isUpdating}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        ) : user.status === 'INACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusModal(user, 'ACTIVE')}
                            disabled={currentUser?.id === user.id.toString() || isUpdating}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        ) : user.status === 'SUSPENDED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusModal(user, 'ACTIVE')}
                            disabled={currentUser?.id === user.id.toString() || isUpdating}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Loading overlay for refresh */}
          {isLoading && users.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Refreshing...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Confirmation Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of{' '}
              <span className="font-semibold">{selectedUser?.full_name}</span> to{' '}
              <span className="font-semibold">{newStatus}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">User:</span>
                <span className="font-medium">{selectedUser?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span>{selectedUser?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Status:</span>
                {selectedUser && getStatusBadge(selectedUser.status)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">New Status:</span>
                {newStatus && getStatusBadge(newStatus as AdminUserStatus)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className={newStatus === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Confirm ${newStatus === 'ACTIVE' ? 'Activation' : 'Deactivation'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
