
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
  doctorName: z.string().optional().describe("The name of the doctor for whom this suggestion is being generated."),
  doctorPreferences: z.string().optional().describe('Specific prescribing preferences or common patterns for this doctor, if known.'),
});
export type SuggestPrescriptionInput = z.infer<typeof SuggestPrescriptionInputSchema>;

const MedicationDetailSchema = z.object({
  name: z.string().describe('Name of the medication (e.g., Amoxicillin, Ibuprofen).'),
  dosage: z.string().describe('Dosage strength and form (e.g., "500mg tablet", "10ml suspension", "20mg capsule").'),
  frequency: z.string().describe('How often to take the medication (e.g., "twice a day", "every 6 hours", "once daily at bedtime").'),
  duration: z.string().optional().describe('Duration of treatment (e.g., "for 7 days", "for 1 month", "as needed for pain"). If not applicable or "as needed", it can be stated or omitted.'),
  route: z.string().optional().describe('Route of administration (e.g., "oral", "topical", "intramuscular"). Default to "oral" if not specified.'),
  additionalInstructions: z.string().optional().describe('Specific instructions for this medication, if any (e.g., "take with food", "avoid direct sunlight").')
});

const SuggestPrescriptionOutputSchema = z.object({
  medications: z.array(MedicationDetailSchema)
    .describe('A list of suggested medications. Each medication should include its name, dosage, frequency, duration (if applicable), and route. Include specific additional instructions per medication if necessary.')
    .min(1, { message: "At least one medication should be suggested if a prescription is warranted."}),
  generalInstructions: z.string().optional().describe('General advice or instructions applicable to the overall treatment plan or patient well-being (e.g., "Rest and stay hydrated", "Monitor blood pressure daily"). Do not repeat medication-specific instructions here.'),
  followUp: z.string().optional().describe('Recommendations for follow-up care or monitoring (e.g., "Follow up in 2 weeks if no improvement", "Return if fever exceeds 102°F", "Routine check-up in 3 months").'),
  additionalNotes: z.string().optional().describe('Any other important notes, warnings, contraindications, or considerations for the doctor regarding this prescription suggestion. This can include potential interactions if known from patient history.'),
});
export type SuggestPrescriptionOutput = z.infer<typeof SuggestPrescriptionOutputSchema>;

export async function suggestPrescription(input: SuggestPrescriptionInput): Promise<SuggestPrescriptionOutput> {
  return suggestPrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPrescriptionPrompt',
  input: {schema: SuggestPrescriptionInputSchema},
  output: {schema: SuggestPrescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting prescriptions for {{#if doctorName}}Dr. {{{doctorName}}}{{else}}the attending doctor{{/if}}.
Given the patient's symptoms, diagnosis, and medical history, provide a structured prescription suggestion.

Patient Details:
Symptoms: {{{symptoms}}}
Diagnosis: {{{diagnosis}}}
Patient History: {{{patientHistory}}}
{{#if doctorName}}
Doctor: Dr. {{{doctorName}}}
{{/if}}
{{#if doctorPreferences}}
Known Doctor Preferences/Patterns: {{{doctorPreferences}}}
{{/if}}

Output Format Guidance:
Provide the prescription in a structured format as defined by the output schema.
1.  **Medications**:
    *   List each medication with its `name`, `dosage` (e.g., "500mg tablet", "10mg/5ml syrup"), `frequency` (e.g., "once daily", "every 8 hours"), `duration` (e.g., "for 10 days", "as needed"), `route` (e.g., "oral", "topical") and any `additionalInstructions` specific to that drug (e.g., "take with meals").
    *   If no medication is appropriate, provide an empty array for medications and explain why in 'additionalNotes'.
2.  **General Instructions**: Provide any overall advice for the patient not specific to a single medication (e.g., "Increase fluid intake", "Get plenty of rest").
3.  **Follow Up**: Suggest when and under what conditions the patient should seek follow-up care.
4.  **Additional Notes**: Include any critical warnings, potential interactions based on patient history, contraindications, or other important considerations for the prescribing doctor.

Consider potential allergies, interactions, or contraindications when formulating the suggestion.
Ensure all suggested fields in the output schema are populated appropriately.
If suggesting multiple medications, ensure they are compatible.
Base your suggestions on standard medical practices.
If crucial information is missing from the input (e.g. patient allergies when suggesting a common allergen), note this in the 'additionalNotes' and make a safe, conditional suggestion.
Prioritize safety and efficacy.
`,
});

const suggestPrescriptionFlow = ai.defineFlow(
  {
    name: 'suggestPrescriptionFlow',
    inputSchema: SuggestPrescriptionInputSchema,
    outputSchema: SuggestPrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate a structured prescription suggestion.");
    }
    // Ensure medications array is present, even if empty, to match schema
    if (!output.medications) {
        output.medications = [];
    }
    return output;
  }
);

