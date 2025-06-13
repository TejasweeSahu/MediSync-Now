
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { PatientList } from '@/components/dashboard/PatientList';
import { PrescriptionGenerator } from '@/components/dashboard/PrescriptionGenerator';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import type { Patient, Appointment } from '@/types';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const prescriptionSectionRef = useRef<HTMLDivElement>(null);
  const { patients, refreshPatients, refreshAppointments, isLoadingPatients, isLoadingAppointments } = useAppState();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthenticated) { // Only fetch data if authenticated
      refreshPatients();
      refreshAppointments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Depend on isAuthenticated to refetch if login state changes


  const handleSelectPatientAndScroll = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient && prescriptionSectionRef.current) {
      setTimeout(() => {
        prescriptionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    if (!appointment || !appointment.patientName) {
        console.warn('Invalid appointment data received.');
        toast({
            title: "Error",
            description: "Invalid appointment data.",
            variant: "destructive",
        });
        handleSelectPatientAndScroll(null);
        return;
    }

    const patientName = appointment.patientName;
    const patientToSelect = patients.find(
        (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase()
    );

    if (patientToSelect) {
      handleSelectPatientAndScroll(patientToSelect);
    } else {
      console.warn("Patient with name \"" + patientName + "\" not found in records. Creating temporary patient object.");
      
      const temporaryPatient: Patient = {
        id: "temp-appointment-" + appointment.id, 
        name: appointment.patientName,
        age: appointment.patientAge !== undefined ? appointment.patientAge : 0, 
        diagnosis: appointment.symptoms || 'Awaiting diagnosis', 
        history: 'Patient details loaded from appointment. Verify and complete medical history. This is not a saved patient record yet.',
        prescriptions: [], 
      };
      
      handleSelectPatientAndScroll(temporaryPatient);
      toast({
        title: "Temporary Patient Loaded",
        description: `Details for ${appointment.patientName} loaded from appointment. This is a temporary view; save a prescription to create a permanent record.`,
        variant: "default",
      });
    }
  };
  
  const handlePatientRecordUpdate = (updatedPatient: Patient) => {
    setSelectedPatient(updatedPatient); 
    refreshPatients(); 
  };

  if (isAuthLoading || (!isAuthenticated && !isAuthLoading) ) { // Added check for !isAuthenticated before redirect
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-6 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <p className="text-muted-foreground mt-2">Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-2">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Doctor Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6" ref={prescriptionSectionRef}>
            <PrescriptionGenerator 
              selectedPatient={selectedPatient}
              onPatientRecordUpdated={handlePatientRecordUpdate} 
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <UpcomingAppointments onAppointmentSelect={handleAppointmentClick} />
          </div>
        </div>

        <Separator className="my-8" />
        
        <div>
          <PatientList onSelectPatient={handleSelectPatientAndScroll} />
        </div>

      </div>
    </AppShell>
  );
}
