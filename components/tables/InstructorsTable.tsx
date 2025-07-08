// components/tables/InstructorsTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, Mail, Car, MapPin, Calendar, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface InstructorData {
  id: string;
  fullName: string;
  email: string;
  carDetails: string;
  withdrawnAmount: number;
  vaultAmount: number;
  avgWage: number;
  avgTime: string;
  avgDistance: string;
  address: string;
  rating: number;
}

interface InstructorsTableProps {
  title: string;
  data: InstructorData[];
}

export default function InstructorsTable({ title, data }: InstructorsTableProps) {
  const formatCurrency = (amount: number) => {
    return `$${amount}`;
  };

  const getRatingDisplay = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Car Details</TableHead>
              <TableHead>Withdrawn Amount $$$</TableHead>
              <TableHead>Vault Amount $$$</TableHead>
              <TableHead>Avg Wage/ride</TableHead>
              <TableHead>Avg time/ride</TableHead>
              <TableHead>Avg distance/ride</TableHead>
              <TableHead>address</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  No instructors found
                </TableCell>
              </TableRow>
            ) : (
              data.map((instructor) => (
                <TableRow key={instructor.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-sm">{instructor.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{instructor.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{instructor.carDetails}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(instructor.withdrawnAmount)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(instructor.vaultAmount)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {formatCurrency(instructor.avgWage)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{instructor.avgTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{instructor.avgDistance}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[120px]">
                      <span className="truncate">{instructor.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRatingDisplay(instructor.rating)}
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