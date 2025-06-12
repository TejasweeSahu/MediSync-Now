// src/ai/flows/suggest-prescription.ts
'use server';
/**
 * @fileOverview A prescription suggestion AI agent.
 *
 * - suggestPrescription - A function that handles the prescription suggestion process.
 * - SuggestPrescriptionInput - The input type for the suggestPrescription function.
 * - SuggestPrescriptionOutput - The return type for the suggestPrescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPrescriptionInputSchema = z.object({
  symptoms: z.string().describe('The symptoms presented by the patient.'),
  diagnosis: z.string().describe('The diagnosis of the patient.'),
  patientHistory: z.string().optional().describe('The medical history of the patient, if available.'),
});
export type SuggestPrescriptionInput = z.infer<typeof SuggestPrescriptionInputSchema>;

const SuggestPrescriptionOutputSchema = z.object({
  prescriptionSuggestion: z.string().describe('The suggested prescription based on the symptoms and diagnosis.'),
  additionalNotes: z.string().optional().describe('Any additional notes or considerations for the prescription.'),
});
export type SuggestPrescriptionOutput = z.infer<typeof SuggestPrescriptionOutputSchema>;

export async function suggestPrescription(input: SuggestPrescriptionInput): Promise<SuggestPrescriptionOutput> {
  return suggestPrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPrescriptionPrompt',
  input: {schema: SuggestPrescriptionInputSchema},
  output: {schema: SuggestPrescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting prescriptions for doctors. Given the patient's symptoms, diagnosis, and medical history, suggest an appropriate prescription.

Symptoms: {{{symptoms}}}
Diagnosis: {{{diagnosis}}}
Patient History: {{{patientHistory}}}

Consider any potential allergies, interactions, or contraindications when formulating the suggestion. Provide clear and concise instructions for the prescription, including dosage and frequency.

Prescription Suggestion:`,
});

const suggestPrescriptionFlow = ai.defineFlow(
  {
    name: 'suggestPrescriptionFlow',
    inputSchema: SuggestPrescriptionInputSchema,
    outputSchema: SuggestPrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
