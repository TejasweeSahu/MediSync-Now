import type { Patient, Doctor } from '@/types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Rohan Sharma',
    age: 34,
    diagnosis: 'Common Cold, Viral Fever',
    history: 'No major illnesses. Occasional seasonal allergies.',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: '2',
    name: 'Priya Singh',
    age: 28,
    diagnosis: 'Migraine',
    history: 'History of migraines since adolescence. Allergic to penicillin.',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: '3',
    name: 'Amit Patel',
    age: 45,
    diagnosis: 'Hypertension',
    history: 'Diagnosed with hypertension 2 years ago. On regular medication.',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: '4',
    name: 'Sunita Reddy',
    age: 52,
    diagnosis: 'Type 2 Diabetes',
    history: 'Family history of diabetes. Diagnosed 5 years ago.',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
];

export const mockDoctors: Doctor[] = [
  { id: 'doc1', name: 'Dr. Alisha Mehta', specialty: 'General Physician' },
  { id: 'doc2', name: 'Dr. Vikram Rao', specialty: 'Cardiologist' },
  { id: 'doc3', name: 'Dr. Priya Desai', specialty: 'Pediatrician' },
];

export const defaultDoctor: Doctor = mockDoctors[0]; // Dr. Alisha Mehta
