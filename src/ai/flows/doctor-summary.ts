'use server';

/**
 * @fileOverview Provides a summary of a doctor's shift, including patient count, common ailments,
 * and frequently prescribed medications.
 *
 * - generateDoctorSummary - A function that generates the doctor's shift summary.
 * - DoctorSummaryInput - The input type for the generateDoctorSummary function.
 * - DoctorSummaryOutput - The return type for the generateDoctorSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoctorSummaryInputSchema = z.object({
  doctorName: z.string().describe('The name of the doctor.'),
  shiftDate: z.string().describe('The date of the shift (YYYY-MM-DD).'),
  patientRecords: z.string().describe('A list of patient records in JSON format including diagnosis and prescriptions.'),
});
export type DoctorSummaryInput = z.infer<typeof DoctorSummaryInputSchema>;

const DoctorSummaryOutputSchema = z.object({
  patientCount: z.number().describe('The total number of patients seen during the shift.'),
  commonAilments: z.string().describe('A comma-separated list of the most common ailments observed during the shift.'),
  frequentMedications: z.string().describe('A comma-separated list of the most frequently prescribed medications during the shift.'),
  summary: z.string().describe('A concise summary of the shift, including notable patterns or observations.'),
});
export type DoctorSummaryOutput = z.infer<typeof DoctorSummaryOutputSchema>;

export async function generateDoctorSummary(input: DoctorSummaryInput): Promise<DoctorSummaryOutput> {
  return doctorSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'doctorSummaryPrompt',
  input: {schema: DoctorSummaryInputSchema},
  output: {schema: DoctorSummaryOutputSchema},
  prompt: `You are an AI assistant providing a summary for doctor's shift.

You are given doctor's name, shift date, and patient records. Analyze the patient records to provide a summary of the shift, identifying the number of patients seen, most common ailments, and frequently prescribed medications. Use the provided patient records to determine the key information.

Doctor Name: {{{doctorName}}}
Shift Date: {{{shiftDate}}}
Patient Records: {{{patientRecords}}}

Based on this data, create a summary with these data points:

Patient Count:
Common Ailments:
Frequent Medications:
Summary:
`,
});

const doctorSummaryFlow = ai.defineFlow(
  {
    name: 'doctorSummaryFlow',
    inputSchema: DoctorSummaryInputSchema,
    outputSchema: DoctorSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
