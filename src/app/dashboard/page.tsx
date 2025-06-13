
'use client';
import React, { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PatientList } from '@/components/dashboard/PatientList';
import { PrescriptionGenerator } from '@/components/dashboard/PrescriptionGenerator';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import type { Patient } from '@/types';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/hooks/useAppState'; // Import useAppState to access patients

export default function DashboardPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const prescriptionSectionRef = useRef<HTMLDivElement>(null);
  const { patients } = useAppState(); // Get patients from global state

  const handleSelectPatientAndScroll = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient && prescriptionSectionRef.current) {
      // Wait for the state to update and DOM to re-render if necessary
      setTimeout(() => {
        prescriptionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // A small delay can help ensure the section is ready
    } else if (!patient && prescriptionSectionRef.current) {
        // Optionally scroll to top or a default position if patient is deselected
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAppointmentClick = (patientName: string) => {
    const patientToSelect = patients.find(p => p.name === patientName);
    if (patientToSelect) {
      handleSelectPatientAndScroll(patientToSelect);
    } else {
      // Handle case where patient might not be found, though unlikely with mock data
      console.warn(`Patient with name "${patientName}" not found for appointment click.`);
      handleSelectPatientAndScroll(null); // Deselect if patient not found
    }
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
          <PrescriptionGenerator selectedPatient={selectedPatient} />
        </div>

      </div>
    </AppShell>
  );
}
