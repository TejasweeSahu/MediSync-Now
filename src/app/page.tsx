
'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/shared/Logo';
import { Stethoscope, Users, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [isFrontDeskLoading, setIsFrontDeskLoading] = useState(false);
  const [isDoctorLoginLoading, setIsDoctorLoginLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="mb-12 text-center">
        <Logo iconSize={56} textSize="text-5xl" />
        <p className="mt-2 text-lg text-muted-foreground">Streamlined Healthcare Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-10 w-10 text-primary" />
              <CardTitle className="text-3xl font-headline">Front Desk</CardTitle>
            </div>
            <CardDescription className="text-base min-h-[40px]">
              Manage appointments and patient interactions efficiently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/front-desk" passHref legacyBehavior>
              <a onClick={() => setIsFrontDeskLoading(true)} className="w-full">
                <Button className="w-full text-lg py-6" size="lg" disabled={isFrontDeskLoading || isDoctorLoginLoading}>
                  {isFrontDeskLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Access Front Desk"
                  )}
                </Button>
              </a>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="h-10 w-10 text-primary" />
              <CardTitle className="text-3xl font-headline">Doctor Portal</CardTitle>
            </div>
            <CardDescription className="text-base min-h-[40px]">
              View patient records, manage prescriptions, and check your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" passHref legacyBehavior>
              <a onClick={() => setIsDoctorLoginLoading(true)} className="w-full">
                <Button className="w-full text-lg py-6" size="lg" disabled={isFrontDeskLoading || isDoctorLoginLoading}>
                  {isDoctorLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Doctor Login"
                  )}
                </Button>
              </a>
            </Link>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} MediSync Now. All rights reserved.</p>
      </footer>
    </div>
  );
}
