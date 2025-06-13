
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form'; // Renamed to avoid conflict
import { Label } from '@/components/ui/label'; // Import the base Label component
import { Loader2, Sparkles, FileText, Pill, Save, History, AlertTriangle, Info } from 'lucide-react';
import { suggestPrescription } from '@/ai/flows/suggest-prescription';
import type { SuggestPrescriptionInput, SuggestPrescriptionOutput, MedicationDetail } from '@/ai/flows/suggest-prescription';
import type { Patient } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { format as formatDateFn } from 'date-fns';

const formSchema = z.object({
  symptoms: z.string().min(10, { message: "Symptoms must be at least 10 characters." }),
  diagnosis: z.string().min(5, { message: "Diagnosis must be at least 5 characters." }),
  patientHistory: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof formSchema>;

interface PrescriptionGeneratorProps {
  selectedPatient?: Patient | null;
  onPatientRecordUpdated?: (patient: Patient) => void;
}

interface CurrentSuggestionState {
  suggestion: SuggestPrescriptionOutput;
  symptoms: string;
  diagnosis: string;
}

export const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({ selectedPatient, onPatientRecordUpdated }) => {
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSuggestionData, setCurrentSuggestionData] = useState<CurrentSuggestionState | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState<SuggestPrescriptionOutput | null>(null);
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
      setCurrentSuggestionData(null); 
      setEditedSuggestion(null);
      setIsAISuggesting(false); 
      setIsSaving(false);
    } else {
      form.reset({ symptoms: '', diagnosis: '', patientHistory: '' });
      setCurrentSuggestionData(null);
      setEditedSuggestion(null);
      setIsAISuggesting(false);
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient]);

  const handleGenerateSuggestion: SubmitHandler<PrescriptionFormValues> = async (data) => {
    setIsAISuggesting(true);
    setCurrentSuggestionData(null);
    setEditedSuggestion(null);
    try {
      const aiInput: SuggestPrescriptionInput = {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        patientHistory: data.patientHistory || 'N/A',
        doctorName: doctor?.name,
      };
      const result = await suggestPrescription(aiInput);
      setCurrentSuggestionData({ suggestion: result, symptoms: data.symptoms, diagnosis: data.diagnosis });
      setEditedSuggestion(JSON.parse(JSON.stringify(result))); // Deep copy for editing
      toast({
        title: "Prescription Suggested",
        description: "AI has generated a structured prescription suggestion. You can edit it below.",
      });
    } catch (error) {
      console.error('Error generating prescription:', error);
      toast({
        title: "AI Suggestion Error",
        description: (error as Error)?.message || "Failed to generate prescription suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAISuggesting(false);
    }
  };
  
  const formatPrescriptionForSaving = (
    suggestionData: SuggestPrescriptionOutput,
    symptoms: string,
    diagnosis: string
  ): string => {
    const now = new Date();
    const dateTimeString = formatDateFn(now, "yyyy-MM-dd 'at' HH:mm");
    let formattedString = `Prescribed on: ${dateTimeString}\n\n`;
    
    formattedString += `Symptoms: ${symptoms}\n`;
    formattedString += `Diagnosis: ${diagnosis}\n\n`;

    formattedString += "Prescription Details:\n";

    if (suggestionData.medications && suggestionData.medications.length > 0) {
      formattedString += "\nMedications:\n";
      suggestionData.medications.forEach(med => {
        formattedString += `- ${med.name} ${med.dosage}`;
        if (med.route) formattedString += ` (${med.route})`;
        formattedString += `, ${med.frequency}`;
        if (med.duration) formattedString += ` ${med.duration}`;
        if (med.additionalInstructions) formattedString += `\n  Instructions: ${med.additionalInstructions}`;
        formattedString += "\n";
      });
    } else {
      formattedString += "No specific medications suggested at this time.\n";
    }

    if (suggestionData.generalInstructions) {
      formattedString += `\nGeneral Instructions:\n${suggestionData.generalInstructions}\n`;
    }

    if (suggestionData.followUp) {
      formattedString += `\nFollow Up:\n${suggestionData.followUp}\n`;
    }

    if (suggestionData.additionalNotes) {
      formattedString += `\nAdditional Notes for Doctor:\n${suggestionData.additionalNotes}\n`;
    }
    
    return formattedString.trim();
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient || !editedSuggestion || !currentSuggestionData) { // Ensure currentSuggestionData for symptoms/diagnosis
      toast({
        title: "Cannot Save",
        description: "No patient selected or no suggestion available/edited.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let patientToUse = selectedPatient;
    const isActuallyInFirestore = allPatientsFromContext.some(p => p.id === selectedPatient.id);

    try {
      if (!isActuallyInFirestore && selectedPatient.id.startsWith('temp-appointment-')) {
        const { id, ...patientDataToSave } = selectedPatient; 
         if (!patientDataToSave.name || !patientDataToSave.diagnosis) {
            toast({ title: "Missing Info", description: "Cannot save temporary patient without name and diagnosis.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        const newSavedPatient = await addPatient(patientDataToSave as Omit<Patient, 'id' | 'prescriptions' | 'createdAt' | 'displayActivityTimestamp'> & {prescriptions?: string[]});
        patientToUse = newSavedPatient;
        await refreshPatients(); 
        if (onPatientRecordUpdated) {
            onPatientRecordUpdated(newSavedPatient); 
        }
        toast({
          title: "Patient Record Created",
          description: `${newSavedPatient.name}'s record has been saved to the system.`,
          className: "bg-primary text-primary-foreground",
        });
      }

      const prescriptionText = formatPrescriptionForSaving(
        editedSuggestion, // Use the edited suggestion
        currentSuggestionData.symptoms, // Original symptoms from when AI was called
        currentSuggestionData.diagnosis // Original diagnosis from when AI was called
      );
      await addPrescriptionToPatient(patientToUse.id, prescriptionText);
      
      if (onPatientRecordUpdated) {
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

  const handleMedicationFieldChange = (
    medIndex: number,
    fieldName: keyof MedicationDetail,
    value: string
  ) => {
    setEditedSuggestion(prev => {
      if (!prev) return null;
      const newMeds = prev.medications ? [...prev.medications] : [];
      if (newMeds[medIndex]) {
        // @ts-ignore
        newMeds[medIndex] = { ...newMeds[medIndex], [fieldName]: value };
      }
      return { ...prev, medications: newMeds };
    });
  };

  const handleGenericFieldChange = (
    fieldName: 'generalInstructions' | 'followUp' | 'additionalNotes',
    value: string
  ) => {
    setEditedSuggestion(prev => {
      if (!prev) return null;
      return { ...prev, [fieldName]: value };
    });
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Sparkles className="text-primary" /> AI Prescription Assistant
        </CardTitle>
        <CardDescription>
          {selectedPatient ? `Review or generate a new prescription suggestion for ${selectedPatient.name}.` : "Select a patient to get started."}
          {" For new suggestions, please ensure current symptoms and diagnosis are accurately entered below. You can edit the AI's suggestion before saving."}
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
                  <RHFFormLabel>Current Symptoms (for AI suggestion)</RHFFormLabel>
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
                  <RHFFormLabel>Underlying/Confirmed Diagnosis</RHFFormLabel>
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
                  <RHFFormLabel>Relevant Patient History (Optional)</RHFFormLabel>
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

      {editedSuggestion && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="text-accent" /> Current AI Suggestion (Editable)</h3>
            <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
              
              {editedSuggestion.medications && editedSuggestion.medications.length > 0 ? (
                <div>
                  <strong className="block text-md font-medium text-foreground mb-2">Medications:</strong>
                  <ul className="space-y-4 list-inside">
                    {editedSuggestion.medications.map((med, index) => (
                      <li key={index} className="p-4 border rounded-md bg-background shadow-sm space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormItem>
                            <Label className="text-xs">Name</Label>
                            <Input 
                              value={med.name || ''} 
                              onChange={(e) => handleMedicationFieldChange(index, 'name', e.target.value)}
                              placeholder="Medication Name"
                              className="text-sm"
                            />
                          </FormItem>
                          <FormItem>
                            <Label className="text-xs">Dosage</Label>
                            <Input 
                              value={med.dosage || ''} 
                              onChange={(e) => handleMedicationFieldChange(index, 'dosage', e.target.value)}
                              placeholder="e.g., 500mg tablet"
                              className="text-sm"
                            />
                          </FormItem>
                          <FormItem>
                            <Label className="text-xs">Frequency</Label>
                            <Input 
                              value={med.frequency || ''} 
                              onChange={(e) => handleMedicationFieldChange(index, 'frequency', e.target.value)}
                              placeholder="e.g., twice a day"
                              className="text-sm"
                            />
                          </FormItem>
                          <FormItem>
                            <Label className="text-xs">Duration (Optional)</Label>
                            <Input 
                              value={med.duration || ''} 
                              onChange={(e) => handleMedicationFieldChange(index, 'duration', e.target.value)}
                              placeholder="e.g., for 7 days"
                              className="text-sm"
                            />
                          </FormItem>
                          <FormItem>
                            <Label className="text-xs">Route (Optional)</Label>
                            <Input 
                              value={med.route || ''} 
                              onChange={(e) => handleMedicationFieldChange(index, 'route', e.target.value)}
                              placeholder="e.g., oral"
                              className="text-sm"
                            />
                          </FormItem>
                        </div>
                        <FormItem>
                          <Label className="text-xs">Additional Instructions (Optional)</Label>
                          <Textarea
                            value={med.additionalInstructions || ''}
                            onChange={(e) => handleMedicationFieldChange(index, 'additionalInstructions', e.target.value)}
                            placeholder="e.g., take with food"
                            rows={2}
                            className="text-sm"
                          />
                        </FormItem>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Alert variant="default">
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Medications Suggested</AlertTitle>
                  <AlertDescription>
                    The AI did not suggest specific medications based on the input. This might be appropriate, or further details may be needed. Check "Additional Notes" for more context.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="block text-md font-medium text-foreground mb-1">General Instructions (Optional)</Label>
                <Textarea 
                    value={editedSuggestion.generalInstructions || ''} 
                    onChange={(e) => handleGenericFieldChange('generalInstructions', e.target.value)}
                    placeholder="General advice for the patient"
                    rows={3}
                    className="text-sm p-3 border rounded-md bg-background shadow-sm"
                />
              </div>
              
              <div>
                <Label className="block text-md font-medium text-foreground mb-1">Follow Up (Optional)</Label>
                <Textarea 
                    value={editedSuggestion.followUp || ''} 
                    onChange={(e) => handleGenericFieldChange('followUp', e.target.value)}
                    placeholder="Follow-up recommendations"
                    rows={3}
                    className="text-sm p-3 border rounded-md bg-background shadow-sm"
                />
              </div>

              <Alert variant={editedSuggestion.medications && editedSuggestion.medications.length > 0 ? "default" : "destructive"}>
                {editedSuggestion.medications && editedSuggestion.medications.length > 0 ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>Additional Notes for Doctor (Optional)</AlertTitle>
                <Textarea 
                    value={editedSuggestion.additionalNotes || ''} 
                    onChange={(e) => handleGenericFieldChange('additionalNotes', e.target.value)}
                    placeholder="Critical warnings, interactions, etc."
                    rows={3}
                    className="text-sm mt-2 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
              </Alert>
              
              <div className="flex justify-end mt-4">
                <Button onClick={handleSavePrescription} disabled={!selectedPatient || !editedSuggestion || isSaving || isAISuggesting}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving? 'Saving...' : 'Save Suggestion to Record'}
                </Button>
              </div>
            </div>
        </CardContent>
      )}
       {!selectedPatient && !isAISuggesting && !editedSuggestion && (
        <CardContent className="mt-4 border-t pt-4">
            <p className="text-center text-muted-foreground">Please select a patient from the list to enable prescription generation.</p>
        </CardContent>
      )}
    </Card>
  );
};


    

    