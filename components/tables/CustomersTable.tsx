// components/tables/CustomersTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, Mail, Phone, MapPin, Car, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface CustomerData {
  id: string;
  fullName: string;
  email: string;
  contact: string;
  hasRideBookedOrBookedism: boolean; // "Any Ride Booked? (Boolean)"
  totalRideCount: number;
  passedFailed: 'passed' | 'failed' | 'pending' | 'not_attempted';
}

interface CustomersTableProps {
  title: string;
  data: CustomerData[];
}

export default function CustomersTable({ title, data }: CustomersTableProps) {
  const getPassedFailedDisplay = (status: string) => {
    const statusConfig = {
      'passed': { 
        color: 'bg-green-100 text-green-800', 
        text: 'Passed',
        icon: CheckCircle
      },
      'failed': { 
        color: 'bg-red-100 text-red-800', 
        text: 'Failed',
        icon: XCircle
      },
      'pending': { 
        color: 'bg-yellow-100 text-yellow-800', 
        text: 'Pending',
        icon: null
      },
      'not_attempted': { 
        color: 'bg-gray-100 text-gray-800', 
        text: 'Not Attempted',
        icon: null
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status, icon: null };

    return (
      <Badge className={config.color}>
        {config.icon && <config.icon className="w-3 h-3 mr-1" />}
        {config.text}
      </Badge>
    );
  };

  const getRideBookedDisplay = (hasBooked: boolean) => {
    return hasBooked ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Yes
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        No
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Any Ride Booked? (Boolean)</TableHead>
              <TableHead>Total Ride Count</TableHead>
              <TableHead>Passed/Failed</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              data.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-sm">{customer.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{customer.contact}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRideBookedDisplay(customer.hasRideBookedOrBookedism)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium">{customer.totalRideCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPassedFailedDisplay(customer.passedFailed)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}