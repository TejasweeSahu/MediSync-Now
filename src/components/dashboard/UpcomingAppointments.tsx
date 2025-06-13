
'use client';

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import type { Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarDays, User, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

interface UpcomingAppointmentsProps {
  onAppointmentSelect: (appointment: Appointment) => void;
}

const INITIAL_APPOINTMENTS_TO_DISPLAY = 2; 
const EXPANDED_SCROLL_HEIGHT = "500px";

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ onAppointmentSelect }) => {
  const { getAppointmentsForDoctor, isLoadingAppointments, appointments, refreshAppointments, updateAppointmentStatus } = useAppState();
  const { doctor } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (doctor) {
        refreshAppointments(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor]); 

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCompleteAppointment = async (
    event: React.MouseEvent,
    appointmentId: string,
    patientName: string
  ) => {
    event.stopPropagation(); // Prevent card click from triggering onAppointmentSelect
    try {
      await updateAppointmentStatus(appointmentId, 'Completed');
      toast({
        title: "Appointment Completed",
        description: `Appointment for ${patientName} has been marked as completed.`,
        className: "bg-primary text-primary-foreground",
      });
      // The list will refresh due to AppStateContext update, or we can manually refresh if needed
      // refreshAppointments(); // Usually not needed if context updates trigger re-render
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast({
        title: "Error",
        description: "Failed to complete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const doctorAppointments = doctor ? getAppointmentsForDoctor(doctor.id) : [];

  const appointmentsToRender = isExpanded
    ? doctorAppointments
    : doctorAppointments.slice(0, INITIAL_APPOINTMENTS_TO_DISPLAY);

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
            {[...Array(INITIAL_APPOINTMENTS_TO_DISPLAY)].map((_, i) => ( 
                 <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          <p className="text-muted-foreground text-center py-2">Loading appointments...</p>
        </CardContent>
      </Card>
    );
  }
  
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

  const renderAppointmentCards = (appointmentsList: Appointment[]) => (
    appointmentsList.map((appointment) => (
      <Card 
        key={appointment.id} 
        className="bg-background hover:shadow-md transition-shadow"
        // Make card clickable only if not clicking the complete button
        onClick={(e) => {
            // Check if the click target or its parent is the complete button
            if ((e.target as HTMLElement).closest('[data-complete-button="true"]')) {
                return;
            }
            onAppointmentSelect(appointment);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { 
            if ((e.target as HTMLElement).closest('[data-complete-button="true"]')) {
                return;
            }
            if (e.key === 'Enter' || e.key === ' ') onAppointmentSelect(appointment);
        }}
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
        <CardContent className="text-sm text-muted-foreground space-y-1 pb-2">
          <div className="flex items-center gap-2">
            <User size={14} /> Age: {appointment.patientAge !== undefined ? appointment.patientAge : 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} /> 
            {appointment.appointmentDate ? format(parseISO(appointment.appointmentDate), "PPpp") : 'Date N/A'}
          </div>
        </CardContent>
        {appointment.status === 'Scheduled' && (
            <CardFooter className="pt-1 pb-3 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleCompleteAppointment(e, appointment.id, appointment.patientName)}
                    className="text-xs h-8" // Adjusted height
                    data-complete-button="true" // Custom attribute to identify the button
                >
                    <CheckCircle2 size={14} className="mr-1" />
                    Mark as Complete
                </Button>
            </CardFooter>
        )}
      </Card>
    ))
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <CalendarDays className="text-primary" /> My Appointments
          {doctorAppointments.length > 0 && <span className="text-xl font-medium text-muted-foreground">({doctorAppointments.length})</span>}
        </CardTitle>
        <CardDescription>Your scheduled appointments. Click an appointment to view patient details for prescription.</CardDescription>
      </CardHeader>
      <CardContent>
        {isExpanded && doctorAppointments.length > INITIAL_APPOINTMENTS_TO_DISPLAY ? (
          <ScrollArea 
            className="pr-4 transition-all duration-300 ease-in-out" 
            style={{ height: EXPANDED_SCROLL_HEIGHT }}
          >
            <div className="space-y-4">
              {renderAppointmentCards(appointmentsToRender)}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            {renderAppointmentCards(appointmentsToRender)}
          </div>
        )}
        
        {doctorAppointments.length > INITIAL_APPOINTMENTS_TO_DISPLAY && (
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
