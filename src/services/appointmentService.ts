
// src/services/appointmentService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import type { Appointment } from '@/types';

const appointmentsCollectionRef = collection(db, 'appointments');

export async function getAppointments(): Promise<Appointment[]> {
  const snapshot = await getDocs(appointmentsCollectionRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appointmentDate: typeof data.appointmentDate === 'string' ? data.appointmentDate : (data.appointmentDate?.toDate?.().toISOString() || new Date().toISOString()),
    } as Appointment;
  });
}

export async function getAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
  const q = query(appointmentsCollectionRef, where('doctorId', '==', doctorId));
  const snapshot = await getDocs(q);
  const appointments = snapshot.docs.map(doc => {
     const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appointmentDate: typeof data.appointmentDate === 'string' ? data.appointmentDate : (data.appointmentDate?.toDate?.().toISOString() || new Date().toISOString()),
    } as Appointment;
  });
  return appointments.sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
}

export async function addAppointment(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
  const docRef = await addDoc(appointmentsCollectionRef, {
    ...appointmentData,
    status: 'Scheduled', // Default status
    // createdAt: serverTimestamp(),
    // updatedAt: serverTimestamp(),
  });
  
  const newAppointment: Appointment = {
    id: docRef.id,
    patientName: appointmentData.patientName,
    patientAge: appointmentData.patientAge,
    symptoms: appointmentData.symptoms,
    doctorId: appointmentData.doctorId,
    doctorName: appointmentData.doctorName, // Ensure this is passed in
    appointmentDate: typeof appointmentData.appointmentDate === 'string' ? appointmentData.appointmentDate : new Date(appointmentData.appointmentDate).toISOString(),
    status: 'Scheduled',
  };
  return newAppointment;
}

export async function updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
  const appointmentDocRef = doc(db, 'appointments', appointmentId);
  await updateDoc(appointmentDocRef, {
    status,
    // updatedAt: serverTimestamp()
  });
}
