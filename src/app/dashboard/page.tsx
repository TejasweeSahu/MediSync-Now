
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PatientList } from '@/components/dashboard/PatientList';
import { PrescriptionGenerator } from '@/components/dashboard/PrescriptionGenerator';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import type { Patient, Appointment } from '@/types';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const prescriptionSectionRef = useRef<HTMLDivElement>(null);
  const { patients, refreshPatients, refreshAppointments } = useAppState(); // patients are now from Firestore via context
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch or refresh if needed, though AppStateContext handles initial load
    refreshPatients();
    refreshAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    // Ensure `patients` from context is used here
    const patientToSelect = patients.find(
        (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase()
    );

    if (patientToSelect) {
      handleSelectPatientAndScroll(patientToSelect);
    } else {
      console.warn(`Patient with name "${patientName}" not found in records. Creating temporary patient object.`);
      
      const temporaryPatient: Patient = {
        id: `temp-appointment-${appointment.id}`, // Temporary ID
        name: appointment.patientName,
        age: appointment.patientAge !== undefined ? appointment.patientAge : 0, // Ensure age is number
        diagnosis: appointment.symptoms || 'Awaiting diagnosis', // Use symptoms as initial diagnosis
        history: 'Patient details loaded from appointment. Verify and complete medical history. This is not a saved patient record yet.',
        prescriptions: [], // Initialize prescriptions array
      };
      
      handleSelectPatientAndScroll(temporaryPatient);
      toast({
        title: "Temporary Patient Loaded",
        description: `Details for ${appointment.patientName} loaded from appointment. This is a temporary view; save a prescription to create a permanent record.`,
        variant: "default",
      });
    }
  };
  
  // Callback for PrescriptionGenerator to update this page's selectedPatient state
  // This is crucial when a temporary patient is saved to Firestore and gets a new ID.
  const handlePatientRecordUpdate = (updatedPatient: Patient) => {
    setSelectedPatient(updatedPatient); // This ensures the dashboard page state is current
    refreshPatients(); // Optionally refresh the main list from context
  };


  return (
    <AppShell>
      <div className="container mx-auto py-2">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Doctor Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PatientList onSelectPatient={handleSelectPatientAndScroll} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <UpcomingAppointments onAppointmentSelect={handleAppointmentClick} />
          </div>
        </div>

        <Separator className="my-8" />
        
        <div ref={prescriptionSectionRef}>
          <PrescriptionGenerator 
            selectedPatient={selectedPatient}
            onPatientRecordUpdated={handlePatientRecordUpdate} 
          />
        </div>

      </div>
    </AppShell>
  );
}
