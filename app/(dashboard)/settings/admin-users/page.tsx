// app/(dashboard)/settings/admin-users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  User, 
  Mail, 
  Calendar,
  Shield,
  Users as UsersIcon
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

// Mock admin users data - replace with real API call
const mockAdminUsers = [
  {
    id: 1,
    full_name: 'John Admin',
    email: 'john@elanroadtest.com',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-15T10:30:00.000Z',
    last_login: '2024-12-15T14:30:00.000Z',
  },
  {
    id: 2,
    full_name: 'Sarah Manager',
    email: 'sarah@elanroadtest.com',
    role: 'admin',
    status: 'active',
    created_at: '2024-02-20T10:30:00.000Z',
    last_login: '2024-12-14T09:15:00.000Z',
  },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [adminUsers, setAdminUsers] = useState(mockAdminUsers);
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = adminUsers.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  return (
    <>
      <DashboardHeader
        title="Admin Users"
        subtitle="Manage administrator accounts and permissions."
        actions={
          <Link href="/settings/admin-users/create">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </Link>
        }
      />

      <div className="px-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-blue-600" />
              Admin Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading admin users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No admin users found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search criteria</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((adminUser) => (
                    <TableRow key={adminUser.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{adminUser.full_name}</p>
                            {currentUser?.id === adminUser.id.toString() && (
                              <p className="text-xs text-primary">(You)</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{adminUser.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-500" />
                          <span className="text-sm capitalize">{adminUser.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(adminUser.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(adminUser.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(adminUser.last_login).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={currentUser?.id === adminUser.id.toString()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}