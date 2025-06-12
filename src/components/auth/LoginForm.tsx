
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, User } from 'lucide-react';
import { defaultDoctor } from '@/data/mockData';
import { useToast } from "@/hooks/use-toast";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('doctor@medisync.now'); // Default for simulation
  const [password, setPassword] = useState<string>('password'); // Default for simulation
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login - in a real app, you'd validate credentials
    // For this simulation, any non-empty password for the default email works
    // and logs in as the defaultDoctor.
    if (email === 'doctor@medisync.now' && password) {
      login(defaultDoctor.id); // Log in as the default doctor
      toast({
        title: "Login Successful",
        description: `Welcome back, ${defaultDoctor.name}!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">Doctor Login</CardTitle>
        <CardDescription>Access your MediSync Now dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 pl-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>
           <p className="text-xs text-muted-foreground">
              Use <code className="font-code bg-muted px-1 py-0.5 rounded">doctor@medisync.now</code> and any password for demo.
            </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-base py-6">
            Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
