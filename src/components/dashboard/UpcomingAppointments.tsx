
'use client';

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarDays, User, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface UpcomingAppointmentsProps {
  onAppointmentSelect: (appointment: Appointment) => void;
}

const INITIAL_APPOINTMENTS_THRESHOLD_FOR_BUTTON = 2; 
const INITIAL_SCROLL_HEIGHT = "280px"; // Adjusted to better fit ~2 items
const EXPANDED_SCROLL_HEIGHT = "500px";

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ onAppointmentSelect }) => {
  const { getAppointmentsForDoctor, isLoadingAppointments, appointments, refreshAppointments } = useAppState();
  const { doctor } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (doctor) {
        refreshAppointments(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor]); 

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!doctor && !isLoadingAppointments) { 
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <CalendarDays className="text-primary" /> My Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading doctor information or no doctor logged in.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoadingAppointments) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <CalendarDays className="text-primary" /> My Appointments
          </CardTitle>
           <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => ( // Show 2 skeletons for consistency
                 <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          <p className="text-muted-foreground text-center py-2">Loading appointments...</p>
        </CardContent>
      </Card>
    );
  }
  
  const doctorAppointments = doctor ? getAppointmentsForDoctor(doctor.id) : [];


  if (!doctorAppointments.length) {
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

  const displayedAppointments = isExpanded ? doctorAppointments : doctorAppointments.slice(0, INITIAL_APPOINTMENTS_THRESHOLD_FOR_BUTTON);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <CalendarDays className="text-primary" /> My Appointments
        </CardTitle>
        <CardDescription>Your scheduled appointments. Click an appointment to view patient details for prescription.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea 
          className="pr-4 transition-all duration-300 ease-in-out" 
          style={{ height: isExpanded ? EXPANDED_SCROLL_HEIGHT : INITIAL_SCROLL_HEIGHT }}
        >
          <div className="space-y-4">
            {/* Always render based on slice for initial view, scroll area handles actual visibility */}
            {doctorAppointments.map((appointment) => (
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
                    {appointment.appointmentDate ? format(parseISO(appointment.appointmentDate), "PPpp") : 'Date N/A'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
        {doctorAppointments.length > INITIAL_APPOINTMENTS_THRESHOLD_FOR_BUTTON && (
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
      </CardContent>
    </Card>
  );
};

