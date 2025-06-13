
'use client';

import type { Patient, Appointment } from '@/types';
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as patientService from '@/services/patientService';
import * as appointmentService from '@/services/appointmentService';

interface AppStateContextType {
  patients: Patient[];
  isLoadingPatients: boolean;
  addPatient: (patientData: Omit<Patient, 'id' | 'prescriptions'> & {prescriptions?: string[]}) => Promise<Patient>;
  updatePatient: (patientId: string, updatedData: Partial<Omit<Patient, 'id'>>) => Promise<void>;
  addPrescriptionToPatient: (patientId: string, prescriptionText: string) => Promise<void>;
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => Promise<Appointment>;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => Promise<void>;
  getAppointmentsForDoctor: (doctorId: string) => Appointment[]; // This can remain synchronous if appointments are already loaded
  refreshAppointments: () => Promise<void>;
  refreshPatients: () => Promise<void>;
}

export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      // await patientService.seedInitialPatientsIfEmpty(); // Seed if empty on first load
      const fetchedPatients = await patientService.getPatients();
      setPatients(fetchedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    try {
      const fetchedAppointments = await appointmentService.getAppointments();
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);
  
  useEffect(() => {
    // Seed initial patient data to Firestore if the collection is empty.
    // This is primarily for demo purposes. In a real app, data management is more complex.
    // This check runs once when the app loads.
    const seedData = async () => {
        await patientService.seedInitialPatientsIfEmpty();
        // After potential seeding, fetch patients.
        fetchPatients();
    };
    seedData();
    fetchAppointments();
  }, [fetchPatients, fetchAppointments]);


  const addPatientContext = useCallback(async (patientData: Omit<Patient, 'id' | 'prescriptions'> & {prescriptions?: string[]}): Promise<Patient> => {
    const newPatient = await patientService.addPatient(patientData);
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, []);

  const updatePatientContext = useCallback(async (patientId: string, updatedData: Partial<Omit<Patient, 'id'>>) => {
    await patientService.updatePatient(patientId, updatedData);
    setPatients((prevPatients) =>
      prevPatients.map((p) => (p.id === patientId ? { ...p, ...updatedData } : p))
    );
  }, []);

  const addPrescriptionToPatientContext = useCallback(async (patientId: string, prescriptionText: string) => {
    await patientService.addPrescriptionToPatientFS(patientId, prescriptionText);
    setPatients((prevPatients) =>
      prevPatients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              prescriptions: [...(p.prescriptions || []), prescriptionText],
            }
          : p
      )
    );
  }, []);

  const addAppointmentContext = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    const newAppointment = await appointmentService.addAppointment(appointmentData);
    setAppointments((prevAppointments) => [...prevAppointments, newAppointment]);
    return newAppointment;
  }, []);

  const updateAppointmentStatusContext = useCallback(async (appointmentId: string, status: Appointment['status']) => {
    await appointmentService.updateAppointmentStatus(appointmentId, status);
    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === appointmentId ? { ...app, status } : app
      )
    );
  }, []);

  const getAppointmentsForDoctorContext = useCallback((doctorId: string) => {
    // This filters loaded appointments. For real-time, service would query Firestore.
    return appointments.filter(app => app.doctorId === doctorId).sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }, [appointments]);

  return (
    <AppStateContext.Provider value={{ 
      patients, 
      isLoadingPatients,
      addPatient: addPatientContext,
      updatePatient: updatePatientContext, 
      addPrescriptionToPatient: addPrescriptionToPatientContext, 
      appointments, 
      isLoadingAppointments,
      addAppointment: addAppointmentContext, 
      updateAppointmentStatus: updateAppointmentStatusContext, 
      getAppointmentsForDoctor: getAppointmentsForDoctorContext,
      refreshAppointments: fetchAppointments,
      refreshPatients: fetchPatients,
    }}>
      {children}
    </AppStateContext.Provider>
  );
};
