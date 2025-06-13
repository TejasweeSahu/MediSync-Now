
'use client';
import React, { useState, useRef } from 'react';
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
  const [shouldAutoSuggestPrescription, setShouldAutoSuggestPrescription] = useState<boolean>(false);
  const prescriptionSectionRef = useRef<HTMLDivElement>(null);
  const { patients } = useAppState();
  const { toast } = useToast();

  const handleSelectPatientAndScroll = (patient: Patient | null, autoSuggest: boolean = false) => {
    setSelectedPatient(patient);
    setShouldAutoSuggestPrescription(autoSuggest);

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
        handleSelectPatientAndScroll(null, false);
        return;
    }

    const patientName = appointment.patientName;
    const patientToSelect = patients.find(
        (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase()
    );

    if (patientToSelect) {
      handleSelectPatientAndScroll(patientToSelect, true); // Auto-suggest for appointments
    } else {
      console.warn(`Patient with name "${patientName}" not found in main records. Creating temporary patient from appointment.`);
      
      const temporaryPatient: Patient = {
        id: `temp-appointment-${appointment.id}`, 
        name: appointment.patientName,
        age: appointment.patientAge !== undefined ? appointment.patientAge : 0,
        diagnosis: appointment.symptoms, 
        history: 'Patient details loaded from appointment. Verify and complete medical history.',
      };
      
      handleSelectPatientAndScroll(temporaryPatient, true); // Auto-suggest for appointments
      toast({
        title: "Temporary Patient Loaded",
        description: `Details for ${appointment.patientName} loaded from appointment. This is not a saved patient record.`,
        variant: "default",
      });
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-2">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Doctor Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Pass autoSuggest=false for PatientList selections */}
            <PatientList onSelectPatient={(patient) => handleSelectPatientAndScroll(patient, false)} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <UpcomingAppointments onAppointmentSelect={handleAppointmentClick} />
          </div>
        </div>

        <Separator className="my-8" />
        
        <div ref={prescriptionSectionRef}>
          <PrescriptionGenerator 
            selectedPatient={selectedPatient} 
            triggerAutoSuggestion={shouldAutoSuggestPrescription} 
          />
        </div>

      </div>
    </AppShell>
  );
}
