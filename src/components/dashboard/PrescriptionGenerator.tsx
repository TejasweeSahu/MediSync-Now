
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, FileText, Pill, Save, History } from 'lucide-react';
import { suggestPrescription } from '@/ai/flows/suggest-prescription';
import type { SuggestPrescriptionInput, SuggestPrescriptionOutput } from '@/ai/flows/suggest-prescription';
import type { Patient } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  symptoms: z.string().min(10, { message: "Symptoms must be at least 10 characters." }),
  diagnosis: z.string().min(5, { message: "Diagnosis must be at least 5 characters." }),
  patientHistory: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof formSchema>;

interface PrescriptionGeneratorProps {
  selectedPatient?: Patient | null;
  onPatientRecordUpdated?: (patient: Patient) => void; // Callback to update DashboardPage's selectedPatient
}

export const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({ selectedPatient, onPatientRecordUpdated }) => {
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestPrescriptionOutput | null>(null);
  const { toast } = useToast();
  const { addPatient, addPrescriptionToPatient, patients: allPatientsFromContext, refreshPatients } = useAppState();
  const { doctor } = useAuth();

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      patientHistory: '',
    },
  });

  useEffect(() => {
    if (selectedPatient) {
      form.reset({
        symptoms: selectedPatient.diagnosis || '', 
        diagnosis: selectedPatient.diagnosis || '',
        patientHistory: selectedPatient.history || '',
      });
      setSuggestion(null); 
      setIsAISuggesting(false); 
      setIsSaving(false);
    } else {
      form.reset({ symptoms: '', diagnosis: '', patientHistory: '' });
      setSuggestion(null);
      setIsAISuggesting(false);
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient]); // form removed as a dependency to prevent reset on every keystroke

  const handleGenerateSuggestion: SubmitHandler<PrescriptionFormValues> = async (data) => {
    setIsAISuggesting(true);
    setSuggestion(null);
    try {
      const aiInput: SuggestPrescriptionInput = {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        patientHistory: data.patientHistory || 'N/A',
        doctorName: doctor?.name,
      };
      const result = await suggestPrescription(aiInput);
      setSuggestion(result);
      toast({
        title: "Prescription Suggested",
        description: "AI has generated a prescription suggestion based on your input.",
      });
    } catch (error) {
      console.error('Error generating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to generate prescription suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAISuggesting(false);
    }
  };
  
  const handleSavePrescription = async () => {
    if (!selectedPatient || !suggestion) {
      toast({
        title: "Cannot Save",
        description: "No patient selected or no suggestion generated.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let patientToUse = selectedPatient;
    // Check if the patient is a temporary one (i.e., their ID isn't in the main Firestore-backed list)
    // A simple heuristic for temporary ID might be checking if it's not a typical Firestore ID length/format,
    // or if it's not found in allPatientsFromContext after ensuring allPatientsFromContext is fresh.
    // For this prototype, we can check if the ID exists in the `allPatientsFromContext` list.
    // This assumes `allPatientsFromContext` is reasonably up-to-date from Firestore.
    const isActuallyInFirestore = allPatientsFromContext.some(p => p.id === selectedPatient.id);

    try {
      if (!isActuallyInFirestore && selectedPatient.id.startsWith('temp-appointment-')) { // More explicit check for temporary
        // Patient is temporary, save them to Firestore first
        const { id, ...patientDataToSave } = selectedPatient; // Exclude the temporary ID
         if (!patientDataToSave.name || !patientDataToSave.diagnosis) {
            toast({ title: "Missing Info", description: "Cannot save temporary patient without name and diagnosis.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        const newSavedPatient = await addPatient(patientDataToSave as Omit<Patient, 'id' | 'prescriptions'> & {prescriptions?: string[]});
        patientToUse = newSavedPatient;
        await refreshPatients(); // Refresh patient list in context
        if (onPatientRecordUpdated) {
            onPatientRecordUpdated(newSavedPatient); // Update DashboardPage's selectedPatient state
        }
        toast({
          title: "Patient Record Created",
          description: `${newSavedPatient.name}'s record has been saved to the system.`,
          className: "bg-primary text-primary-foreground",
        });
      }

      const prescriptionText = `${suggestion.prescriptionSuggestion}${suggestion.additionalNotes ? `\n\nAdditional Notes:\n${suggestion.additionalNotes}` : ''}`;
      await addPrescriptionToPatient(patientToUse.id, prescriptionText);
      
      // After saving, refetch the specific patient to get the latest prescriptions for the accordion
      if (onPatientRecordUpdated) {
         // Simulate fetching the updated patient. In a real scenario, you might fetch this patient again.
         const updatedPatientWithPrescription = {
            ...patientToUse,
            prescriptions: [...(patientToUse.prescriptions || []), prescriptionText]
         };
         onPatientRecordUpdated(updatedPatientWithPrescription);
      }


      toast({
        title: "Prescription Saved",
        description: `The prescription has been saved to ${patientToUse.name}'s record.`,
        className: "bg-primary text-primary-foreground",
      });

    } catch (error) {
        console.error("Error saving prescription or patient:", error);
        toast({
            title: "Save Error",
            description: "Failed to save prescription or patient record. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Sparkles className="text-primary" /> AI Prescription Assistant
        </CardTitle>
        <CardDescription>
          {selectedPatient ? `Review or generate a new prescription suggestion for ${selectedPatient.name}.` : "Select a patient to get started."}
          {" For new suggestions, please ensure current symptoms are accurately entered below."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerateSuggestion)}>
          <CardContent className="space-y-4">
            {selectedPatient && (
              <>
                <Alert>
                  <Pill className="h-4 w-4" />
                  <AlertTitle className="font-medium">Patient: {selectedPatient.name}</AlertTitle>
                  <AlertDescription>
                    Age: {selectedPatient.age}, Initial/Main Diagnosis: {selectedPatient.diagnosis}
                    {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                      <span className="block mt-1 text-xs text-muted-foreground">
                        ({selectedPatient.prescriptions.length} prior prescription(s) on record)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 text-sm">
                            <History className="h-4 w-4 text-muted-foreground" />
                            View Prior Prescriptions ({selectedPatient.prescriptions.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 max-h-48 overflow-y-auto p-1 pr-3">
                          {selectedPatient.prescriptions.map((prescription, index) => (
                            <div key={index} className="text-xs p-3 border rounded-md bg-background whitespace-pre-wrap">
                              {prescription}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            )}
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Symptoms (for AI suggestion)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Persistent cough, fever, headache for 3 days..." {...field} rows={3} disabled={isAISuggesting || isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Underlying/Confirmed Diagnosis</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acute Bronchitis" {...field} disabled={isAISuggesting || isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevant Patient History (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Allergic to penicillin, history of asthma..." {...field} rows={2} disabled={isAISuggesting || isSaving}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isAISuggesting || !selectedPatient || isSaving}>
              {isAISuggesting ? ( 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isAISuggesting ? 'Generating...' : 'Suggest New / Refine'}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {suggestion && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><FileText className="text-accent" /> Current AI Suggestion</h3>
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <strong className="block text-sm font-medium text-foreground">Suggestion:</strong>
                <p className="text-foreground whitespace-pre-wrap">{suggestion.prescriptionSuggestion}</p>
              </div>
              {suggestion.additionalNotes && (
                <div>
                  <strong className="block text-sm font-medium text-foreground">Additional Notes:</strong>
                  <p className="text-foreground whitespace-pre-wrap">{suggestion.additionalNotes}</p>
                </div>
              )}
              <Button onClick={handleSavePrescription} className="mt-4" disabled={!selectedPatient || !suggestion || isSaving || isAISuggesting}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving? 'Saving...' : 'Save Suggestion to Record'}
              </Button>
            </div>
        </CardContent>
      )}
       {!selectedPatient && !isAISuggesting && (
        <CardContent className="mt-4 border-t pt-4">
            <p className="text-center text-muted-foreground">Please select a patient from the list to enable prescription generation.</p>
        </CardContent>
      )}
    </Card>
  );
};
