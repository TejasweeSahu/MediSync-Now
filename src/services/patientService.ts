
// src/services/patientService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import type { Patient } from '@/types';
import { mockPatients as initialMockPatients } from '@/data/mockData'; // Renamed to avoid conflict

const patientsCollectionRef = collection(db, 'patients');

export async function seedInitialPatientsIfEmpty(): Promise<void> {
  try {
    const snapshot = await getDocs(patientsCollectionRef);
    if (snapshot.empty) {
      console.log("Patients collection is empty. Seeding initial patients to Firestore...");
      const batch = writeBatch(db);
      initialMockPatients.forEach(patient => {
        const patientDocRef = doc(patientsCollectionRef, patient.id); // Use mock ID for seeding consistency
        batch.set(patientDocRef, {
          ...patient,
          prescriptions: patient.prescriptions || [],
          // createdAt: serverTimestamp(), // Using serverTimestamp is good practice
          // updatedAt: serverTimestamp(),
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const patientDocRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(patientDocRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Patient;
  }
  return null;
}


export async function updatePatient(patientId: string, data: Partial<Omit<Patient, 'id'>>): Promise<void> {
  const patientDocRef = doc(db, 'patients', patientId);
  await updateDoc(patientDocRef, {
    ...data,
    // updatedAt: serverTimestamp(),
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
export async function addPatient(patientData: Omit<Patient, 'id' | 'prescriptions'> & {prescriptions?: string[]}): Promise<Patient> {
    const docRef = await addDoc(patientsCollectionRef, {
        ...patientData,
        prescriptions: patientData.prescriptions || [],
        // createdAt: serverTimestamp(),
        // updatedAt: serverTimestamp(),
    });
    const newPatient = { id: docRef.id, ...patientData, prescriptions: patientData.prescriptions || [] };
    return newPatient as Patient;
}
