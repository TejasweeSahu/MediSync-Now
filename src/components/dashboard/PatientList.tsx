
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAppState } from '@/hooks/useAppState';
import type { Patient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditPatientForm } from './EditPatientForm';
import { Users, Pencil, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientListProps {
  onSelectPatient?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const { patients, isLoadingPatients } = useAppState();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setEditingPatient(null);
  };

  if (isLoadingPatients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Patient Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          ))}
          <p className="text-muted-foreground text-center py-2">Loading patient records...</p>
        </CardContent>
      </Card>
    );
  }

  if (!patients.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No patient records available. Add patients through the front desk or relevant system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <Users className="text-primary" /> Patient Records
          </CardTitle>
          <CardDescription>Overview of all registered patients. Click a row to select for prescription or click Edit to modify.</CardDescription>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow 
                    key={patient.id} 
                    className={onSelectPatient ? "cursor-pointer hover:bg-muted/50" : "" } 
                    onClick={onSelectPatient ? (e) => {
                      if ((e.target as HTMLElement).closest('button[data-edit-button]')) return;
                      onSelectPatient(patient);
                    } : undefined}
                  >
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
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(patient);}}
                        data-edit-button 
                        aria-label={`Edit patient ${patient.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingPatient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Patient: {editingPatient.name}</DialogTitle>
              <DialogDescription>
                Make changes to the patient's details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <EditPatientForm patient={editingPatient} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
