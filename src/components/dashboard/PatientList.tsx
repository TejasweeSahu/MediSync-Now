
'use client';

import React from 'react';
import Image from 'next/image';
import { useAppState } from '@/hooks/useAppState';
import type { Patient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface PatientListProps {
  onSelectPatient?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const { patients } = useAppState();

  if (!patients.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No patient records available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Users className="text-primary" /> Patient Records
        </CardTitle>
        <CardDescription>Overview of all registered patients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Age</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead className="hidden md:table-cell">History</TableHead>
                {onSelectPatient && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} className={onSelectPatient ? "cursor-pointer hover:bg-muted/50" : "" } onClick={onSelectPatient ? () => onSelectPatient(patient) : undefined}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={patient.avatarUrl || `https://placehold.co/40x40.png`} alt={patient.name} data-ai-hint="person medical" />
                      <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell className="text-center">{patient.age}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">{patient.diagnosis}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell truncate max-w-xs">{patient.history}</TableCell>
                  {onSelectPatient && (
                    <TableCell>
                       {/* Placeholder for actions, or implicitly selected by row click */}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
