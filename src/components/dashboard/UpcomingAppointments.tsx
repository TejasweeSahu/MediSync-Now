
'use client';

import React from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, User, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UpcomingAppointmentsProps {
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ onAppointmentSelect }) => {
  const { getAppointmentsForDoctor } = useAppState();
  const { doctor } = useAuth();

  if (!doctor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays /> My Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading doctor information...</p>
        </CardContent>
      </Card>
    );
  }

  const appointments = getAppointmentsForDoctor(doctor.id);

  if (!appointments.length) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <CalendarDays className="text-primary" /> My Appointments
          </CardTitle>
          <CardDescription>No upcoming appointments scheduled for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">You have a clear schedule!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <CalendarDays className="text-primary" /> My Appointments
        </CardTitle>
        <CardDescription>Your scheduled appointments. Click an appointment to view patient details for prescription.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card 
                key={appointment.id} 
                className="bg-background hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onAppointmentSelect(appointment)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAppointmentSelect(appointment);}}
                aria-label={`Select appointment for ${appointment.patientName}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium">{appointment.patientName}</CardTitle>
                    <Badge 
                      variant={appointment.status === 'Scheduled' ? 'default' : appointment.status === 'Completed' ? 'secondary': 'destructive'}
                      className="capitalize"
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Symptoms: {appointment.symptoms}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={14} /> Age: {appointment.patientAge !== undefined ? appointment.patientAge : 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} /> 
                    {format(parseISO(appointment.appointmentDate), "PPpp")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
