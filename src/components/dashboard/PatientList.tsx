
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAppState } from '@/hooks/useAppState';
import type { Patient } from '@/types';
import type { SortableField } from '@/context/AppStateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditPatientForm } from './EditPatientForm';
import { Users, Pencil, FileText, ChevronDown, ChevronUp, SortAsc, SortDesc, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


interface PatientListProps {
  onSelectPatient?: (patient: Patient) => void;
}

const INITIAL_PATIENTS_COUNT = 3;

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const { patients, isLoadingPatients, sortConfig, setSortConfig, searchTerm, setSearchTerm } = useAppState();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [patientToViewPrescriptions, setPatientToViewPrescriptions] = useState<Patient | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingPatient(null);
  };

  const handleViewPrescriptions = (patient: Patient, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click event
    setPatientToViewPrescriptions(patient);
  };

  const handleClosePrescriptionsDialog = () => {
    setPatientToViewPrescriptions(null);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const displayedPatients = isExpanded ? patients : patients.slice(0, INITIAL_PATIENTS_COUNT);

  if (isLoadingPatients && !searchTerm) { // Only show full loading skeleton if not actively searching
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Patient Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(INITIAL_PATIENTS_COUNT)].map((_, i) => (
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
  
  // Even if loading, if there's a search term, we might want to show search input and a modified "loading results..."
  // For now, this handles no patients found after filtering or initially.
  if (!patients.length && !isLoadingPatients) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Users className="text-primary" /> Patient Records
              </CardTitle>
              <CardDescription>Overview of all registered patients.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-10 pr-3 py-2 h-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {searchTerm ? `No patients found matching "${searchTerm}".` : "No patient records available."}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Users className="text-primary" /> Patient Records
              </CardTitle>
              <CardDescription>Overview of all registered patients. Click a row to select for prescription or click Edit to modify.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-9 pr-3 py-2 h-9 w-full sm:w-[200px] lg:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <Label htmlFor="sort-field" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by:</Label>
                <Select
                  value={sortConfig.field}
                  onValueChange={(value) => setSortConfig({ ...sortConfig, field: value as SortableField })}
                >
                  <SelectTrigger id="sort-field" className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastActivity">Last Activity</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() =>
                    setSortConfig({
                      ...sortConfig,
                      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
                    })
                  }
                  aria-label={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortConfig.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           {isLoadingPatients && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading results for "{searchTerm}"...</p>
            </div>
          )}
          {!isLoadingPatients && patients.length === 0 && searchTerm && (
             <p className="text-muted-foreground text-center py-4">
                No patients found matching "{searchTerm}".
             </p>
          )}
          {!isLoadingPatients && patients.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Avatar</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Age</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead className="hidden md:table-cell">History</TableHead>
                      <TableHead className="text-center">Last Activity</TableHead>
                      <TableHead className="text-center">Prescribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPatients.map((patient) => {
                      const activityDateToDisplay = patient.displayActivityTimestamp || patient.createdAt;
                      return (
                        <TableRow
                          key={patient.id}
                          className={onSelectPatient ? "cursor-pointer hover:bg-muted/50" : "" }
                          onClick={onSelectPatient ? (e) => {
                            if ((e.target as HTMLElement).closest('button[data-action-button]')) return;
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
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {activityDateToDisplay ? format(parseISO(activityDateToDisplay), 'MMM d, p') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            {patient.prescriptions && patient.prescriptions.length > 0 ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs flex items-center justify-center gap-1"
                                onClick={(e) => handleViewPrescriptions(patient, e)}
                                data-action-button // Prevents row click
                              >
                                <FileText size={12} />
                                {patient.prescriptions.length}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleEdit(patient);}}
                              data-action-button // Prevents row click
                              aria-label={`Edit patient ${patient.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {patients.length > INITIAL_PATIENTS_COUNT && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={toggleExpand}
                    className="w-auto bg-secondary/30 hover:bg-secondary/50 text-secondary-foreground"
                  >
                    {isExpanded ? 'Show Less' : 'Show More'}
                    {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              )}
            </>
          )}
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
            <EditPatientForm patient={editingPatient} onClose={handleCloseEditDialog} />
          </DialogContent>
        </Dialog>
      )}

      {patientToViewPrescriptions && (
        <Dialog open={!!patientToViewPrescriptions} onOpenChange={(isOpen) => !isOpen && handleClosePrescriptionsDialog()}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Prescriptions for {patientToViewPrescriptions.name}</DialogTitle>
              <DialogDescription>
                Showing {patientToViewPrescriptions.prescriptions?.length || 0} prior prescription(s).
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] mt-4 pr-3">
              <div className="space-y-3 p-1">
                {patientToViewPrescriptions.prescriptions && patientToViewPrescriptions.prescriptions.length > 0 ? (
                  patientToViewPrescriptions.prescriptions.map((prescription, index) => (
                    <div key={index} className="text-xs p-3 border rounded-md bg-background shadow-sm whitespace-pre-wrap">
                      {prescription}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No prescriptions on record.</p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

