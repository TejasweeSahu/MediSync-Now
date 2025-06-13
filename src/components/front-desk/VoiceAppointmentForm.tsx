
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mic, MicOff, User, Activity, BriefcaseMedical, CalendarIcon as LucideCalendarIcon, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { mockDoctors } from '@/data/mockData';
import type { Doctor } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { parseAppointmentTranscript } from '@/ai/flows/parse-appointment-transcript-flow';
import type { ParseAppointmentTranscriptInput, ParseAppointmentTranscriptOutput } from '@/ai/flows/parse-appointment-transcript-flow';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const appointmentFormSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name must be at least 2 characters." }).optional().default(''),
  patientAge: z.number().min(0).optional(),
  symptoms: z.string().min(5, { message: "Symptoms must be at least 5 characters." }).optional().default(''),
  doctorId: z.string({ required_error: "Please select a doctor." }),
  appointmentDate: z.date({ required_error: "Please select a date and time." }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const defaultFormValues: Partial<AppointmentFormValues> = {
    patientName: '',
    patientAge: undefined,
    symptoms: '',
    doctorId: undefined,
    appointmentDate: undefined,
};

export const VoiceAppointmentForm: React.FC = () => {
  const { addAppointment } = useAppState();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isParsingTranscript, setIsParsingTranscript] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechApiAvailable, setSpeechApiAvailable] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: defaultFormValues,
  });

  const processTranscriptWithAI = useCallback(async (originalText: string) => {
    if (!originalText.trim()) {
      toast({ title: "Empty transcript", description: "Nothing to parse.", variant: "default" });
      return;
    }
    setIsParsingTranscript(true);
    toast({ title: "Processing voice input...", description: "AI is analyzing the transcript.", icon: <Sparkles className="h-4 w-4" /> });

    try {
      const today = new Date();
      const currentDateStr = formatDate(today, "yyyy-MM-dd");

      const aiInput: ParseAppointmentTranscriptInput = {
        transcript: originalText,
        currentDate: currentDateStr,
      };
      const result: ParseAppointmentTranscriptOutput = await parseAppointmentTranscript(aiInput);

      let fieldsUpdatedCount = 0;
      if (result.patientName) {
        form.setValue('patientName', capitalizeName(result.patientName));
        fieldsUpdatedCount++;
      }
      if (result.patientAge !== undefined && !isNaN(result.patientAge)) {
        form.setValue('patientAge', result.patientAge);
        fieldsUpdatedCount++;
      }
      if (result.symptoms) {
        form.setValue('symptoms', capitalizeFirstLetter(result.symptoms));
        fieldsUpdatedCount++;
      }
      
      if (result.doctorQuery) {
        let doctorQueryNormalized = result.doctorQuery.toLowerCase();
        doctorQueryNormalized = doctorQueryNormalized.replace(/^dr\.?\s*/, '').replace(/^doctor\s*/, '');

        const foundDoctor = mockDoctors.find(doc => {
          const doctorNameLower = doc.name.toLowerCase();
          const doctorNameNormalized = doctorNameLower.replace(/^dr\.?\s*/, '').replace(/^doctor\s*/, '');
          const doctorNameParts = doctorNameNormalized.split(' ');

          if (doctorNameNormalized.includes(doctorQueryNormalized)) {
            return true;
          }
          return doctorNameParts.some(part => doctorQueryNormalized.includes(part) && part.length > 2) || 
                 doctorNameParts.some(part => part.includes(doctorQueryNormalized) && doctorQueryNormalized.length > 2);
        });
        
        if (foundDoctor) {
          form.setValue('doctorId', foundDoctor.id);
          fieldsUpdatedCount++;
        } else {
          toast({ title: "Doctor Not Matched", description: `Could not find a doctor for "${result.doctorQuery}". Please select manually.`, variant: "default" });
        }
      }

      if (result.appointmentDateYYYYMMDD && result.appointmentTimeHHMM) {
        try {
          const [year, month, day] = result.appointmentDateYYYYMMDD.split('-').map(Number);
          const [hours, minutes] = result.appointmentTimeHHMM.split(':').map(Number);
          const parsedDateTime = new Date(year, month - 1, day, hours, minutes);
          
          if (!isNaN(parsedDateTime.getTime())) {
            form.setValue('appointmentDate', parsedDateTime);
            fieldsUpdatedCount++;
          } else {
            toast({ title: "Date/Time Parsing Error", description: `AI suggested date "${result.appointmentDateYYYYMMDD}" and time "${result.appointmentTimeHHMM}", but it could not be parsed. Please set manually.`, variant: "default" });
          }
        } catch (e) {
          console.error("Error parsing date/time from AI:", e);
          toast({ title: "Date/Time Format Error", description: "AI returned an unexpected date/time format. Please set manually.", variant: "default" });
        }
      } else if (result.appointmentDateYYYYMMDD || result.appointmentTimeHHMM) {
         toast({ title: "Partial Date/Time", description: "AI extracted partial date/time. Please complete or set manually.", variant: "default" });
      }
      
      if (fieldsUpdatedCount > 0) {
        toast({ title: "Transcript Processed by AI", description: `Form fields updated (${fieldsUpdatedCount} fields). Previous data retained or updated. Please verify.`, icon: <Sparkles className="h-4 w-4" /> });
      } else if (originalText.trim()) {
        toast({ title: "AI Did Not Update Fields", description: "No new specific details were extracted from your latest voice input. Existing information remains.", variant: "default" });
      }

    } catch (error: any) {
      console.error('Error parsing transcript with AI:', error);
       let errorMessage = "The AI service is currently unavailable or overloaded. Please try again in a few moments, or fill the form manually.";
      if (error.message && (error.message.includes('503 Service Unavailable') || error.message.includes('overloaded') || error.message.includes('The model is overloaded'))) {
        errorMessage = "The AI model is currently overloaded or unavailable. Please try again in a few moments, or fill the form manually.";
      }
      toast({ 
        title: "AI Processing Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsParsingTranscript(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, toast]);

  const toggleListening = useCallback(() => {
    if (!speechApiAvailable) {
      toast({ title: "Feature Unavailable", description: "Speech recognition is not supported in your browser.", variant: "destructive"});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false); 
    } else {
      setTranscript(''); 
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: "Listening...", description: "Please speak now. Previous entries will be retained or updated if new information is provided."});
    }
  }, [speechApiAvailable, isListening, toast, setTranscript]);


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechApiAvailable(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);
        setIsListening(false); 
        await processTranscriptWithAI(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({ title: "Speech Recognition Error", description: event.error || "Unknown error", variant: "destructive"});
        setIsListening(false);
      };
      
      recognition.onend = () => {
        if (isListening) { 
            setIsListening(false);
            if (!transcript && !isParsingTranscript) { 
                toast({ title: "No speech detected", description: "Please try speaking again.", variant: "default"});
            }
        }
      };

    } else {
      setSpeechApiAvailable(false);
      console.warn('Speech Recognition API not available.');
    }
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processTranscriptWithAI, toast, toggleListening]); 


  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const capitalizeName = (name: string) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  

  const onSubmit: SubmitHandler<AppointmentFormValues> = (data) => {
    const selectedDoctor = mockDoctors.find(doc => doc.id === data.doctorId);
    if (!selectedDoctor) {
      toast({ title: "Error", description: "Selected doctor not found.", variant: "destructive"});
      return;
    }
     if (!data.patientName || !data.symptoms) {
      toast({ title: "Missing Information", description: "Patient name and symptoms are required.", variant: "destructive"});
      return;
    }
    
    const appointmentData = {
      ...data,
      patientName: data.patientName, 
      symptoms: data.symptoms, 
      patientAge: data.patientAge, 
      doctorName: selectedDoctor.name,
      appointmentDate: data.appointmentDate.toISOString(),
    };
    addAppointment(appointmentData);
    toast({ title: "Appointment Booked!", description: `Appointment for ${data.patientName} with ${selectedDoctor.name} has been scheduled.`});
    form.reset(defaultFormValues); 
    setTranscript('');
  };

  const handleClearForm = () => {
    form.reset(defaultFormValues);
    setTranscript('');
    toast({
      title: "Form Cleared",
      description: "All fields have been reset.",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <Mic className="text-primary" /> Voice Appointment Booking
          </CardTitle>
          <CardDescription>Use your voice or fill the form to book. AI will attempt to fill fields. Please verify all details.</CardDescription>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              size="icon"
              className="rounded-full w-14 h-14 flex-shrink-0" 
              disabled={!speechApiAvailable || isParsingTranscript}
              aria-label={isListening ? "Stop Listening" : isParsingTranscript ? "Processing Voice Input" : "Start Voice Input"}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : isParsingTranscript ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? "Stop Listening" : isParsingTranscript ? "Processing..." : "Start Voice Input"}</p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6"> {/* Added pt-6 to CardContent as header has default p-6 */}
            {!speechApiAvailable && <p className="text-sm text-destructive text-center">Speech recognition not available in this browser.</p>}
            {transcript && (
              <p className="text-sm text-muted-foreground italic text-center">Transcript: "{transcript}"</p>
            )}

            {isParsingTranscript && (
              <div className="flex items-center justify-center p-3 my-2 rounded-md bg-muted/30 border border-dashed border-primary/50">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-primary font-medium">AI is populating the form from your transcript...</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><User size={16}/>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rohan Sharma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><User size={16}/>Patient Age (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="e.g., 34" 
                        {...field} 
                        value={field.value === undefined || Number.isNaN(field.value) ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Activity size={16}/>Symptoms</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Cough and fever" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><BriefcaseMedical size={16}/>Doctor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockDoctors.map((doc: Doctor) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1"><LucideCalendarIcon size={16}/>Appointment Date & Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value, "PPP HH:mm")
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                          <LucideCalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            if (date) {
                                const currentHours = field.value ? field.value.getHours() : new Date().getHours();
                                const currentMinutes = field.value ? field.value.getMinutes() : new Date().getMinutes();
                                const newSelectedDate = new Date(date); 
                                newSelectedDate.setHours(currentHours);
                                newSelectedDate.setMinutes(currentMinutes);
                                field.onChange(newSelectedDate);
                            } else {
                                field.onChange(undefined);
                            }
                        }}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } 
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                            <Label htmlFor="time-picker">Time</Label>
                            <Input 
                                type="time" 
                                id="time-picker"
                                value={field.value ? formatDate(field.value, "HH:mm") : formatDate(new Date(), "HH:mm")}
                                onChange={(e) => {
                                    const newTime = e.target.value;
                                    const [hours, minutes] = newTime.split(':').map(Number);
                                    const newDateWithTime = field.value ? new Date(field.value) : new Date();
                                    
                                    newDateWithTime.setHours(hours);
                                    newDateWithTime.setMinutes(minutes);
                                    newDateWithTime.setSeconds(0);
                                    newDateWithTime.setMilliseconds(0);
                                    field.onChange(newDateWithTime);
                                }}
                            />
                        </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClearForm} 
              className="w-full sm:w-auto"
              disabled={form.formState.isSubmitting || isParsingTranscript || isListening}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto" 
              disabled={form.formState.isSubmitting || isParsingTranscript || isListening}
            >
              {(form.formState.isSubmitting || isParsingTranscript) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
    

