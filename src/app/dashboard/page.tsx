
'use client';
import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PatientList } from '@/components/dashboard/PatientList';
import { PrescriptionGenerator } from '@/components/dashboard/PrescriptionGenerator';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import type { Patient } from '@/types';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  return (
    <AppShell>
      <div className="container mx-auto py-2">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Doctor Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PatientList onSelectPatient={setSelectedPatient} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <UpcomingAppointments />
          </div>
        </div>

        <Separator className="my-8" />
        
        <div>
          <PrescriptionGenerator selectedPatient={selectedPatient} />
        </div>

      </div>
    </AppShell>
  );
}
