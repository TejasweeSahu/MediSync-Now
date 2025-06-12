
'use client';

import type { Patient, Appointment } from '@/types';
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { mockPatients } from '@/data/mockData';

interface AppStateContextType {
  patients: Patient[];
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  getAppointmentsForDoctor: (doctorId: string) => Appointment[];
}

export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    setAppointments((prevAppointments) => [
      ...prevAppointments,
      { 
        ...appointmentData, 
        id: Date.now().toString(), // Simple ID generation
        status: 'Scheduled' 
      },
    ]);
  }, []);

  const updateAppointmentStatus = useCallback((appointmentId: string, status: Appointment['status']) => {
    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === appointmentId ? { ...app, status } : app
      )
    );
  }, []);

  const getAppointmentsForDoctor = useCallback((doctorId: string) => {
    return appointments.filter(app => app.doctorId === doctorId).sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }, [appointments]);

  return (
    <AppStateContext.Provider value={{ patients, appointments, addAppointment, updateAppointmentStatus, getAppointmentsForDoctor }}>
      {children}
    </AppStateContext.Provider>
  );
};
