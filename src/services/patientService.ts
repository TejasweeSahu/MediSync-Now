
// src/services/patientService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import type { Patient } from '@/types';
import { mockPatients as initialMockPatients } from '@/data/mockData'; // Renamed to avoid conflict

const patientsCollectionRef = collection(db, 'patients');

export async function seedInitialPatientsIfEmpty(): Promise<void> {
  try {
    const snapshot = await getDocs(patientsCollectionRef);
    if (snapshot.empty) {
      console.log("Patients collection is empty. Seeding initial patients to Firestore...");
      const batch = writeBatch(db);
      const baseDate = new Date();
      initialMockPatients.forEach((patientData, index) => {
        const { id, ...restOfPatientData } = patientData; // Exclude id from data being set, use it for doc ref
        const patientDocRef = doc(patientsCollectionRef, id); 
        batch.set(patientDocRef, {
          ...restOfPatientData,
          prescriptions: patientData.prescriptions || [],
          // Assign createdAt so that the last patient in the mock array is the newest
          createdAt: new Date(baseDate.getTime() + index * 60000).toISOString(), // Add minutes to make later ones newer
        });
      });
      await batch.commit();
      console.log("Initial patients seeded successfully.");
    } else {
      console.log("Patients collection is not empty. No seeding needed.");
    }
  } catch (error) {
    console.error("Error seeding initial patients:", error);
  }
}

export async function getPatients(): Promise<Patient[]> {
  const snapshot = await getDocs(patientsCollectionRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    let createdAtISO = new Date(0).toISOString(); // Default to a very old date

    if (data.createdAt) {
      if (typeof data.createdAt === 'string') {
        createdAtISO = data.createdAt;
      } else if (data.createdAt instanceof Timestamp) {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number') {
        // Handle cases where it might be a plain object from Firestore
        createdAtISO = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate().toISOString();
      }
    }
    
    return { 
      id: doc.id, 
      ...data,
      createdAt: createdAtISO, // Ensure createdAt is always a string
    } as Patient;
  });
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const patientDocRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(patientDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    let createdAtISO = new Date(0).toISOString();
    if (data.createdAt) {
      if (typeof data.createdAt === 'string') {
        createdAtISO = data.createdAt;
      } else if (data.createdAt instanceof Timestamp) {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number') {
        createdAtISO = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate().toISOString();
      }
    }
    return { id: docSnap.id, ...data, createdAt: createdAtISO } as Patient;
  }
  return null;
}


export async function updatePatient(patientId: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<void> {
  const patientDocRef = doc(db, 'patients', patientId);
  await updateDoc(patientDocRef, {
    ...data,
    // updatedAt: serverTimestamp(), // Consider adding updatedAt if needed
  });
}

export async function addPrescriptionToPatientFS(patientId: string, prescriptionText: string): Promise<void> {
  const patientDocRef = doc(db, 'patients', patientId);
  await updateDoc(patientDocRef, {
    prescriptions: arrayUnion(prescriptionText),
    // updatedAt: serverTimestamp(),
  });
}

// Used when a temporary patient (e.g., from an appointment) is formally saved.
export async function addPatient(patientData: Omit<Patient, 'id' | 'prescriptions' | 'createdAt'> & {prescriptions?: string[]}): Promise<Patient> {
    const dataToSave = {
        ...patientData,
        prescriptions: patientData.prescriptions || [],
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(patientsCollectionRef, dataToSave);
    
    // For returning the patient object immediately, we'll use client-side new Date() for createdAt
    // Firestore will have the serverTimestamp which is more accurate for DB.
    // This is a common pattern when you need the object back right away.
    const newPatient: Patient = { 
        id: docRef.id, 
        ...(patientData as Omit<Patient, 'id' | 'createdAt'>), // Cast to satisfy Patient type, createdAt will be string
        prescriptions: patientData.prescriptions || [],
        createdAt: new Date().toISOString() 
    };
    return newPatient;
}
