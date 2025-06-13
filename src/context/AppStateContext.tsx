
'use client';

import type { Patient, Appointment } from '@/types';
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as patientService from '@/services/patientService';
import * as appointmentService from '@/services/appointmentService';
import { parse as parseDate } from 'date-fns'; // Import parse from date-fns

export type SortableField = 'lastActivity' | 'name' | 'age';
export type SortDirection = 'asc' | 'desc';

interface AppStateContextType {
  patients: Patient[];
  isLoadingPatients: boolean;
  addPatient: (patientData: Omit<Patient, 'id' | 'prescriptions' | 'createdAt' | 'displayActivityTimestamp'> & {prescriptions?: string[]}) => Promise<Patient>;
  updatePatient: (patientId: string, updatedData: Partial<Omit<Patient, 'id' | 'createdAt' | 'displayActivityTimestamp'>>) => Promise<void>;
  addPrescriptionToPatient: (patientId: string, prescriptionText: string) => Promise<void>;
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => Promise<Appointment>;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => Promise<void>;
  getAppointmentsForDoctor: (doctorId: string) => Appointment[];
  refreshAppointments: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  sortConfig: { field: SortableField; direction: SortDirection };
  setSortConfig: (config: { field: SortableField; direction: SortDirection }) => void;
}

export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Helper function to get the latest activity date for a patient
const getLatestActivityDate = (patient: Patient): Date => {
  let latestDate = new Date(patient.createdAt); // Fallback to creation date

  if (patient.prescriptions && patient.prescriptions.length > 0) {
    patient.prescriptions.forEach(prescriptionText => {
      const match = prescriptionText.match(/Prescribed on: (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2})/);
      if (match) {
        const dateString = match[1];
        const timeString = match[2];
        try {
          const prescriptionDate = parseDate(`${dateString} ${timeString}`, 'yyyy-MM-dd HH:mm', new Date());
          if (prescriptionDate.getTime() > latestDate.getTime()) {
            latestDate = prescriptionDate;
          }
        } catch (e) {
          console.warn(`Could not parse date from prescription: "${prescriptionText}"`, e);
        }
      }
    });
  }
  return latestDate;
};

// Helper function to get the value for sorting
const getValueForSortField = (patient: Patient, field: SortableField): string | number | Date => {
  switch (field) {
    case 'name':
      return patient.name.toLowerCase(); // Ensure case-insensitive sort for names
    case 'age':
      return patient.age;
    case 'lastActivity':
      return getLatestActivityDate(patient);
    default:
      // Should not happen with TypeScript, but good practice for robustness
      return getLatestActivityDate(patient);
  }
};


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: SortableField; direction: SortDirection }>({ field: 'lastActivity', direction: 'desc' });

  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      let fetchedPatients = await patientService.getPatients();
      
      // Apply sorting based on sortConfig
      fetchedPatients.sort((a, b) => {
        const valA = getValueForSortField(a, sortConfig.field);
        const valB = getValueForSortField(b, sortConfig.field);

        let comparison = 0;
        if (valA instanceof Date && valB instanceof Date) {
          comparison = valA.getTime() - valB.getTime();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }
        // Add more type checks if other sortable field types are introduced

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
      
      const patientsWithDisplayTimestamp = fetchedPatients.map(patient => ({
        ...patient,
        displayActivityTimestamp: getLatestActivityDate(patient).toISOString(),
      }));

      setPatients(patientsWithDisplayTimestamp);
    } catch (error) {
      console.error("Error fetching or sorting patients:", error);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [sortConfig]); // sortConfig is now a dependency

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
        fetchPatients(); 
        fetchAppointments();
    };
    seedAndFetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPatients, fetchAppointments]); // fetchPatients will change if sortConfig changes, re-triggering


  const addPatientContext = useCallback(async (patientData: Omit<Patient, 'id' | 'prescriptions' | 'createdAt' | 'displayActivityTimestamp'> & {prescriptions?: string[]}): Promise<Patient> => {
    const newPatient = await patientService.addPatient(patientData);
    await fetchPatients(); 
    const refreshedPatient = patients.find(p => p.id === newPatient.id) || {
        ...newPatient,
        displayActivityTimestamp: getLatestActivityDate(newPatient).toISOString(),
    };
    return refreshedPatient;
  }, [fetchPatients, patients]);

  const updatePatientContext = useCallback(async (patientId: string, updatedData: Partial<Omit<Patient, 'id' | 'createdAt' | 'displayActivityTimestamp'>>) => {
    await patientService.updatePatient(patientId, updatedData);
    await fetchPatients();
  }, [fetchPatients]);

  const addPrescriptionToPatientContext = useCallback(async (patientId: string, prescriptionText: string) => {
    await patientService.addPrescriptionToPatientFS(patientId, prescriptionText);
    await fetchPatients(); 
  }, [fetchPatients]);

  const addAppointmentContext = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    const newAppointment = await appointmentService.addAppointment(appointmentData);
    await fetchAppointments();
    return newAppointment; 
  }, [fetchAppointments]);

  const updateAppointmentStatusContext = useCallback(async (appointmentId: string, status: Appointment['status']) => {
    await appointmentService.updateAppointmentStatus(appointmentId, status);
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
      sortConfig,
      setSortConfig,
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

