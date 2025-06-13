
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mic, MicOff, User, Activity, BriefcaseMedical, CalendarIcon as LucideCalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { mockDoctors } from '@/data/mockData';
import type { Doctor } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format as formatDate, parseISO, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { parseAppointmentTranscript } from '@/ai/flows/parse-appointment-transcript-flow';
import type { ParseAppointmentTranscriptOutput, ParseAppointmentTranscriptInput } from '@/ai/flows/parse-appointment-transcript-flow';


const appointmentFormSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name must be at least 2 characters." }).optional().default(''),
  patientAge: z.number().min(0).optional(),
  symptoms: z.string().min(5, { message: "Symptoms must be at least 5 characters." }).optional().default(''),
  doctorId: z.string({ required_error: "Please select a doctor." }),
  appointmentDate: z.date({ required_error: "Please select a date and time." }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
    defaultValues: {
      patientName: '',
      symptoms: '',
      // Let doctorId and appointmentDate be undefined initially
    },
  });

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
        setIsListening(false); // Stop listening UI cue
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
            if (!transcript) { 
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
  }, [isListening]); 

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const capitalizeName = (name: string) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  const processTranscriptWithAI = async (originalText: string) => {
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
      if (result.patientAge !== undefined) {
        form.setValue('patientAge', result.patientAge);
        fieldsUpdatedCount++;
      }
      if (result.symptoms) {
        form.setValue('symptoms', capitalizeFirstLetter(result.symptoms));
        fieldsUpdatedCount++;
      }
      if (result.doctorQuery) {
        const doctorNameQuery = result.doctorQuery.toLowerCase();
        const foundDoctor = mockDoctors.find(doc => 
          doc.name.toLowerCase().includes(doctorNameQuery) || 
          (doc.name.toLowerCase().split(' ').pop()?.includes(doctorNameQuery) && doctorNameQuery.length > 2)
        );
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
          // Month is 0-indexed in JavaScript Date
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
        toast({ title: "Transcript Processed by AI", description: `Form fields updated (${fieldsUpdatedCount} fields). Please verify.`, icon: <Sparkles className="h-4 w-4" /> });
      } else {
        form.setValue('symptoms', capitalizeFirstLetter(originalText)); // Fallback
        toast({ title: "AI Could Not Extract Details", description: "Original transcript placed in symptoms. Please review and fill other fields.", variant: "default" });
      }

    } catch (error) {
      console.error('Error parsing transcript with AI:', error);
      toast({ title: "AI Processing Error", description: "Failed to parse transcript. Please fill the form manually.", variant: "destructive" });
      form.setValue('symptoms', capitalizeFirstLetter(originalText)); // Fallback
    } finally {
      setIsParsingTranscript(false);
    }
  };


  const toggleListening = () => {
    if (!speechApiAvailable) {
      toast({ title: "Feature Unavailable", description: "Speech recognition is not supported in your browser.", variant: "destructive"});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript(''); 
      // Reset only AI-fillable fields, keep doctor/date if manually set
      form.reset({ 
        ...form.getValues(), // Keep existing values like doctorId and appointmentDate
        patientName: '', 
        patientAge: undefined, 
        symptoms: '' 
      });
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: "Listening...", description: "Please speak now."});
    }
  };

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
    form.reset({
        patientName: '',
        patientAge: undefined,
        symptoms: '',
        doctorId: undefined, 
        appointmentDate: undefined,
    }); 
    setTranscript('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Mic className="text-primary" /> Voice Appointment Booking
        </CardTitle>
        <CardDescription>Use your voice or fill the form to book an appointment. AI will attempt to fill fields. Please verify all details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Button
                type="button"
                onClick={toggleListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="w-full sm:w-auto"
                disabled={!speechApiAvailable || isParsingTranscript}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" /> Stop Listening
                  </>
                ) : isParsingTranscript ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" /> Start Voice Input
                  </>
                )}
              </Button>
              {!speechApiAvailable && <p className="text-sm text-destructive">Speech recognition not available in this browser.</p>}
              {transcript && (
                <p className="text-sm text-muted-foreground italic">Transcript: "{transcript}"</p>
              )}
            </div>

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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isParsingTranscript || isListening}>
              {(form.formState.isSubmitting || isParsingTranscript) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
