
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label'; // Changed from FormLabel
import { Loader2, Sparkles, FileText, Pill, Save, History, AlertTriangle, Info, PlusCircle, Trash2, XCircle } from 'lucide-react';
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
  const { addPatient, updatePatient, addPrescriptionToPatient, patients: allPatientsFromContext, refreshPatients } = useAppState();
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
      let historyForForm = selectedPatient.history || '';
      const defaultHistoryMessage = "Patient details loaded from appointment. Verify and complete medical history. This is not a saved patient record yet.";

      if (
        selectedPatient.history === defaultHistoryMessage &&
        selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0
      ) {
        historyForForm = ''; 
      }

      form.reset({
        symptoms: selectedPatient.diagnosis || '', 
        diagnosis: selectedPatient.diagnosis || '',
        patientHistory: historyForForm,
      });
      setCurrentSuggestionData(null); 
      setEditedSuggestion(null);
      // Keep isAISuggesting and isSaving as they are, they manage active processes.
    } else {
      form.reset({ symptoms: '', diagnosis: '', patientHistory: '' });
      setCurrentSuggestionData(null);
      setEditedSuggestion(null);
      // setIsAISuggesting(false); // Only reset if needed, typically on deselection.
      // setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient]); // form.reset is stable

  const handleGenerateSuggestion: SubmitHandler<PrescriptionFormValues> = async (data) => {
    setIsAISuggesting(true);
    setCurrentSuggestionData(null);
    setEditedSuggestion(null);
    try {
      let priorPrescriptionsString: string | undefined = undefined;
      if (selectedPatient && selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0) {
        priorPrescriptionsString = selectedPatient.prescriptions.join('\n\n---\n\n');
      }

      const aiInput: SuggestPrescriptionInput = {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        patientHistory: data.patientHistory || 'N/A',
        priorPrescriptions: priorPrescriptionsString,
        doctorName: doctor?.name,
      };
      const result = await suggestPrescription(aiInput);
      setCurrentSuggestionData({ suggestion: result, symptoms: data.symptoms, diagnosis: data.diagnosis });
      setEditedSuggestion(JSON.parse(JSON.stringify(result))); 
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
    if (!selectedPatient || !editedSuggestion || !currentSuggestionData) {
      toast({
        title: "Cannot Save",
        description: "No patient selected or no suggestion available/edited.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let patientToOperateOnId = selectedPatient.id; // Store the ID for potential re-fetching
    const isTemporaryPatient = selectedPatient.id.startsWith('temp-appointment-');
    const isActuallyInFirestore = allPatientsFromContext.some(p => p.id === selectedPatient.id && !p.id.startsWith('temp-appointment-'));

    const currentPatientHistoryFromForm = form.getValues('patientHistory');
    const prescriptionText = formatPrescriptionForSaving(
        editedSuggestion,
        currentSuggestionData.symptoms,
        currentSuggestionData.diagnosis
    );

    try {
      if (isTemporaryPatient && !isActuallyInFirestore) {
        // This is a temporary patient, create a new record in Firestore
        const { id, prescriptions, createdAt, displayActivityTimestamp, ...patientDataToSaveBase } = selectedPatient;
        const newPatientData = {
            ...patientDataToSaveBase, // name, age, diagnosis
            history: currentPatientHistoryFromForm || '', // Use history from form
        };

        if (!newPatientData.name || !newPatientData.diagnosis) {
            toast({ title: "Missing Info", description: "Cannot save temporary patient without name and diagnosis.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        
        const newSavedPatient = await addPatient(newPatientData as Omit<Patient, 'id' | 'prescriptions' | 'createdAt' | 'displayActivityTimestamp'> & {prescriptions?: string[]});
        patientToOperateOnId = newSavedPatient.id; // Update ID to the newly created patient's ID

        toast({
          title: "Patient Record Created",
          description: `${newSavedPatient.name}'s record has been saved.`,
        });
      } else {
        // Existing patient, update their history
        await updatePatient(patientToOperateOnId, { history: currentPatientHistoryFromForm });
      }

      // Add the prescription to the patient (either newly created or existing)
      await addPrescriptionToPatient(patientToOperateOnId, prescriptionText);
      
      // All async operations are done. AppStateContext should have triggered refreshes.
      // Fetch the latest state of the patient from the context for the UI update.
      // We wait a brief moment to allow context to potentially update from Firestore triggers/fetches
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for context propagation

      const finalRefreshedPatient = allPatientsFromContext.find(p => p.id === patientToOperateOnId);

      if (finalRefreshedPatient && onPatientRecordUpdated) {
        onPatientRecordUpdated(finalRefreshedPatient);
      } else if (onPatientRecordUpdated) {
        // Fallback if not found in context immediately (should be rare)
        console.warn("Patient not immediately found in context after save, constructing fallback for UI.");
        const fallbackPatientData = {
            ...selectedPatient, // Original selected patient data
            id: patientToOperateOnId, // Ensure correct ID
            history: currentPatientHistoryFromForm,
            prescriptions: [...(selectedPatient.prescriptions || []), prescriptionText],
            // displayActivityTimestamp might be stale here for new patients
        };
        onPatientRecordUpdated(fallbackPatientData);
      }

      toast({
        title: "Prescription Saved",
        description: `The prescription has been saved to ${selectedPatient.name}'s record. History also updated.`,
        className: "bg-primary text-primary-foreground",
      });

    } catch (error) {
        console.error("Error saving prescription or patient:", error);
        toast({
            title: "Save Error",
            description: `Failed to save. ${(error as Error)?.message || 'Please try again.'}`,
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

  const handleAddMedication = () => {
    setEditedSuggestion(prev => {
      if (!prev) return null;
      const newMedication: MedicationDetail = {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: '',
        additionalInstructions: ''
      };
      const updatedMedications = prev.medications ? [newMedication, ...prev.medications] : [newMedication];
      return { ...prev, medications: updatedMedications };
    });
  };

  const handleRemoveMedication = (medIndex: number) => {
    setEditedSuggestion(prev => {
      if (!prev || !prev.medications) return null;
      const updatedMedications = prev.medications.filter((_, index) => index !== medIndex);
      return { ...prev, medications: updatedMedications };
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
                  <Label className="font-medium">Current Symptoms (for AI suggestion)</Label>
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
                  <Label className="font-medium">Underlying/Confirmed Diagnosis</Label>
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
                  <Label className="font-medium">Relevant Patient History (Optional)</Label>
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
              {isAISuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isAISuggesting ? 'Generating...' : 'Suggest New / Refine'}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {editedSuggestion && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="text-accent" /> Current AI Suggestion (Editable)</h3>
            <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="block text-md font-medium text-foreground">Medications:</Label>
                  <Button variant="outline" size="sm" onClick={handleAddMedication} className="h-8">
                    <PlusCircle size={16} className="mr-2" /> Add Medication
                  </Button>
                </div>
                {editedSuggestion.medications && editedSuggestion.medications.length > 0 ? (
                  <ul className="space-y-4 list-inside">
                    {editedSuggestion.medications.map((med, index) => (
                      <li key={index} className="p-4 border rounded-md bg-background shadow-sm space-y-3 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMedication(index)}
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remove medication"
                        >
                          <Trash2 size={16} />
                        </Button>
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
                 ) : (
                  <Alert variant="default" className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Medications Added</AlertTitle>
                    <AlertDescription>
                      Click "Add Medication" to manually enter prescription details, or generate an AI suggestion.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <Label className="block text-md font-medium text-foreground">General Instructions (Optional)</Label>
                    {editedSuggestion.generalInstructions && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleGenericFieldChange('generalInstructions', '')} aria-label="Clear general instructions">
                            <XCircle size={16} />
                        </Button>
                    )}
                </div>
                <Textarea 
                    value={editedSuggestion.generalInstructions || ''} 
                    onChange={(e) => handleGenericFieldChange('generalInstructions', e.target.value)}
                    placeholder="General advice for the patient"
                    rows={3}
                    className="text-sm p-3 border rounded-md bg-background shadow-sm"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                    <Label className="block text-md font-medium text-foreground">Follow Up (Optional)</Label>
                    {editedSuggestion.followUp && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleGenericFieldChange('followUp', '')} aria-label="Clear follow up">
                            <XCircle size={16} />
                        </Button>
                    )}
                </div>
                <Textarea 
                    value={editedSuggestion.followUp || ''} 
                    onChange={(e) => handleGenericFieldChange('followUp', e.target.value)}
                    placeholder="Follow-up recommendations"
                    rows={3}
                    className="text-sm p-3 border rounded-md bg-background shadow-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <Label className="block text-md font-medium text-foreground">Additional Notes for Doctor (Optional)</Label>
                    {editedSuggestion.additionalNotes && (
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleGenericFieldChange('additionalNotes', '')} aria-label="Clear additional notes">
                            <XCircle size={16} />
                        </Button>
                    )}
                </div>
                <Textarea 
                    value={editedSuggestion.additionalNotes || ''} 
                    onChange={(e) => handleGenericFieldChange('additionalNotes', e.target.value)}
                    placeholder="Critical warnings, interactions, etc."
                    rows={3}
                    className="text-sm p-3 border rounded-md bg-background shadow-sm"
                />
              </div>
              
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

