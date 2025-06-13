
'use client';

import type { Patient, Appointment } from '@/types';
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as patientService from '@/services/patientService';
import * as appointmentService from '@/services/appointmentService';

interface AppStateContextType {
  patients: Patient[];
  isLoadingPatients: boolean;
  addPatient: (patientData: Omit<Patient, 'id' | 'prescriptions' | 'createdAt'> & {prescriptions?: string[]}) => Promise<Patient>;
  updatePatient: (patientId: string, updatedData: Partial<Omit<Patient, 'id' | 'createdAt'>>) => Promise<void>;
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
      const fetchedPatients = await patientService.getPatients();
      // Sort patients by createdAt in descending order (latest first)
      fetchedPatients.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setPatients(fetchedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
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
    const seedAndFetchData = async () => {
        await patientService.seedInitialPatientsIfEmpty();
        fetchPatients(); // Fetch patients after seeding attempt
        fetchAppointments();
    };
    seedAndFetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed fetchPatients, fetchAppointments from dependency array to avoid re-triggering on their identity change


  const addPatientContext = useCallback(async (patientData: Omit<Patient, 'id' | 'prescriptions' | 'createdAt'> & {prescriptions?: string[]}): Promise<Patient> => {
    const newPatient = await patientService.addPatient(patientData);
    // After adding, refresh all patients to get the correct server-generated timestamp and ensure sorted order
    await fetchPatients(); 
    return newPatient; // Note: newPatient here will have client-side timestamp, list will have server one after fetch
  }, [fetchPatients]);

  const updatePatientContext = useCallback(async (patientId: string, updatedData: Partial<Omit<Patient, 'id' | 'createdAt'>>) => {
    await patientService.updatePatient(patientId, updatedData);
    // After updating, refresh all patients to ensure sorted order and reflect changes
    await fetchPatients();
  }, [fetchPatients]);

  const addPrescriptionToPatientContext = useCallback(async (patientId: string, prescriptionText: string) => {
    await patientService.addPrescriptionToPatientFS(patientId, prescriptionText);
    // After adding prescription, refresh patients to reflect changes (especially if updatedAt were used)
    await fetchPatients(); 
  }, [fetchPatients]);

  const addAppointmentContext = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    const newAppointment = await appointmentService.addAppointment(appointmentData);
    // After adding, refresh appointments
    await fetchAppointments();
    return newAppointment; // Similar to patients, this returns the immediate object. List will be updated.
  }, [fetchAppointments]);

  const updateAppointmentStatusContext = useCallback(async (appointmentId: string, status: Appointment['status']) => {
    await appointmentService.updateAppointmentStatus(appointmentId, status);
    // After updating, refresh appointments
    await fetchAppointments();
  }, [fetchAppointments]);

  const getAppointmentsForDoctorContext = useCallback((doctorId: string) => {
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
