
'use client';

import React, { useState, useEffect } from 'react';
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
  triggerAutoSuggestion?: boolean; // New prop
}

export const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({ selectedPatient, triggerAutoSuggestion = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestPrescriptionOutput | null>(null);
  const { toast } = useToast();
  const { addPrescriptionToPatient, patients: allPatients } = useAppState();
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

      const symptomsForAISuggestion = selectedPatient.diagnosis;

      if (triggerAutoSuggestion && symptomsForAISuggestion && doctor?.name) {
        setIsLoading(true);
        suggestPrescription({
          symptoms: symptomsForAISuggestion,
          diagnosis: selectedPatient.diagnosis || symptomsForAISuggestion,
          patientHistory: selectedPatient.history || 'N/A',
          doctorName: doctor.name,
        })
        .then(result => {
          setSuggestion(result);
          toast({
            title: "Auto-Suggestion Generated",
            description: "An initial prescription suggestion has been generated. Review and refine symptoms if needed.",
          });
        })
        .catch(error => {
          console.error('Error auto-generating prescription:', error);
          toast({
            title: "Auto-Suggestion Error",
            description: "Could not generate initial suggestion. Please enter symptoms and try manually.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false); // Ensure loading is false if not auto-suggesting
      }
    } else {
      form.reset({ symptoms: '', diagnosis: '', patientHistory: '' });
      setSuggestion(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient, triggerAutoSuggestion, form, doctor?.name, toast]);

  const onSubmit: SubmitHandler<PrescriptionFormValues> = async (data) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };
  
  const handleSavePrescription = () => {
    if (!selectedPatient || !selectedPatient.id || !suggestion) {
      toast({
        title: "Cannot Save",
        description: "No patient selected or no suggestion generated.",
        variant: "destructive",
      });
      return;
    }

    const prescriptionText = `${suggestion.prescriptionSuggestion}${suggestion.additionalNotes ? `\n\nAdditional Notes:\n${suggestion.additionalNotes}` : ''}`;
    const isRealPatient = allPatients.some(p => p.id === selectedPatient.id);

    if (isRealPatient) {
      addPrescriptionToPatient(selectedPatient.id, prescriptionText);
      toast({
        title: "Prescription Saved",
        description: `The prescription has been saved to ${selectedPatient.name}'s record.`,
        className: "bg-primary text-primary-foreground",
      });
    } else {
      console.log("Prescription for temporary patient (simulated save):", selectedPatient.name, prescriptionText);
      toast({
        title: "Prescription Noted (Temporary Patient)",
        description: `Prescription for ${selectedPatient.name} noted. This is a temporary record; add patient to system for permanent storage and history tracking.`,
        variant: "default",
      });
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    <Textarea placeholder="e.g., Persistent cough, fever, headache for 3 days..." {...field} rows={3} />
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
                    <Input placeholder="e.g., Acute Bronchitis" {...field} />
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
                    <Textarea placeholder="e.g., Allergic to penicillin, history of asthma..." {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || !selectedPatient}>
              {isLoading && !suggestion && !triggerAutoSuggestion ? ( 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading && !suggestion && !triggerAutoSuggestion ? 'Generating...' : 'Suggest New / Refine'}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {isLoading && suggestion && triggerAutoSuggestion && ( 
         <CardContent className="pt-2 pb-0 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Refreshing suggestion...</p>
        </CardContent>
      )}

      {suggestion && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><FileText className="text-accent" /> {isLoading && triggerAutoSuggestion ? "Loading Suggestion..." : "Current AI Suggestion"}</h3>
          {!(isLoading && triggerAutoSuggestion) && (
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
              <Button onClick={handleSavePrescription} className="mt-4" disabled={!selectedPatient || !suggestion}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Suggestion to Record
              </Button>
            </div>
          )}
        </CardContent>
      )}
       {!selectedPatient && !isLoading && (
        <CardContent className="mt-4 border-t pt-4">
            <p className="text-center text-muted-foreground">Please select a patient from the list to enable prescription generation.</p>
        </CardContent>
      )}
    </Card>
  );
};
