import React, { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Display password rules
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => {
    return (
        <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {met ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    );
};

// Email validation helper using regex
const isEmailValidFormat = (email: string) => {
    if (email.length === 0) return true; 
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regex.test(email);
};

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Password strength check
    const checkPasswordStrength = (pw: string) => {
        return {
            minLength: pw.length >= 8,
            hasUpperCase: /[A-Z]/.test(pw),
            hasLowerCase: /[a-z]/.test(pw),
            hasNumber: /[0-9]/.test(pw),
            hasSpecialChar: /[#?!@$%^&*-]/.test(pw),
        };
    };

    const criteria = useMemo(() => checkPasswordStrength(password), [password]);
    const isPasswordStrong = Object.values(criteria).every(Boolean);
    const passwordsMatch = password === confirmPassword && password.length > 0;
    
    const isEmailValid = useMemo(() => isEmailValidFormat(email), [email]);
    
    const canSubmit = !isLoading && isPasswordStrong && passwordsMatch && isEmailValid && email.length > 0;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await AuthService.register(email, password);
            router.push("/login?success=registered");

        } catch (err) {
            let errorMessage = "An unexpected error occurred during registration.";
            
            if (typeof err === 'string') {
                errorMessage = err + " Please log in.";
            } else if (err && typeof err === 'object' && 'message' in err) {
                 errorMessage = (err as Error).message;
            }
          
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Register | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Card className="w-[400px] shadow-2xl ring-2 ring-primary/40 dark:shadow-none" >
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-extrabold text-foreground">Create Your Account</CardTitle>
                        <CardDescription>
                            Start tracking your job applications now.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="jobseeker@example.com"
                                    value={email}
                                    className={email.length > 0 && !isEmailValid ? "border-red-500" : ""}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {email.length > 0 && !isEmailValid && (
                                    <p className="flex items-center text-sm mt-1 text-red-500">
                                        <AlertTriangle className="w-4 h-4 mr-1"/>
                                        Please enter a valid email.
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="grid gap-2 p-2 rounded-lg border border-border bg-card">
                                <h3 className={`font-semibold text-sm ${isPasswordStrong ? 'text-green-500' : 'text-foreground'}`}>
                                    {isPasswordStrong ? 'Strong Password' : 'Password Requirements:'}
                                </h3>
                                <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                                    <PasswordRequirement met={criteria.minLength} text="Minimum 8 characters" />
                                    <PasswordRequirement met={criteria.hasUpperCase} text="1 Uppercase letter" />
                                    <PasswordRequirement met={criteria.hasLowerCase} text="1 Lowercase letter" />
                                    <PasswordRequirement met={criteria.hasNumber} text="1 Number" />
                                    <PasswordRequirement met={criteria.hasSpecialChar} text="1 Special character" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {confirmPassword.length > 0 && (
                                    <p className={`text-sm mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                                        {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 mt-5">
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={!canSubmit} 
                            >
                                {isLoading ? "Creating Account..." : "Register"}
                            </Button>
                            <div className="text-sm text-center text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="font-semibold text-primary hover:underline">
                                    Log In
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <Footer/>
        </>
    );
}