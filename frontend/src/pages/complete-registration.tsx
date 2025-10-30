import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PasswordInput } from "@/components/ui/PasswordInput";

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => {
    return (
        <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {met ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    );
};

// Password strength check helper
const checkPasswordStrength = (pw: string) => {
    return {
        minLength: pw.length >= 8,
        hasUpperCase: /[A-Z]/.test(pw),
        hasLowerCase: /[a-z]/.test(pw),
        hasNumber: /[0-9]/.test(pw),
        hasSpecialChar: /[#?!@$%^&*-]/.test(pw),
    };
};


export default function CompleteRegistrationPage() {
    const router = useRouter();
    const { email: queryEmail, token: queryToken } = router.query;
    
    const email = Array.isArray(queryEmail) ? queryEmail[0] : queryEmail || ""; 
    const token = Array.isArray(queryToken) ? queryToken[0] : queryToken || "";

    const [firstName, setFirstName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Initial check for required URL parameters
    useEffect(() => {
        if (!router.isReady) return;

        if (!queryEmail || !queryToken) {
            setError("Invalid or missing verification link parameters. Please restart the registration process.");
        }
        setIsInitialLoad(false);
    }, [router.isReady, queryEmail, queryToken]);

    // Password validation logic
    const criteria = useMemo(() => checkPasswordStrength(password), [password]);
    const isPasswordStrong = Object.values(criteria).every(Boolean);
    const passwordsMatch = password === confirmPassword && password.length > 0;
    
    const isFirstNameValid = firstName.trim().length > 0;
    
    const canSubmit = !isLoading && isPasswordStrong && passwordsMatch && isFirstNameValid && !isInitialLoad && !error;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!email || !token) {
                 throw new Error("Missing verification credentials.");
            }
            
            // Call the final registration API
            const responseMessage = await AuthService.completeRegistration({ 
                email, 
                token, 
                firstName, 
                password 
            });

            // Redirect to login with a success message
            router.push(`/login?success=registered&message=${encodeURIComponent(responseMessage)}`);

        } catch (err) {
            let errorMessage = "An unexpected error occurred during final registration.";
            
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err && typeof err === 'object' && 'message' in err) {
                 errorMessage = (err as Error).message;
            }
          
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle loading
    if (isInitialLoad) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="size-15 animate-spin"/>
            </div>
        );
    }
    
    if (error && !isInitialLoad) {
        return (
             <>
                <Head><title>Error | JobLog</title></Head>
                <Header/>
                <div className="flex justify-center items-center min-h-screen bg-background px-4 py-4">
                    <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Verification Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-500 text-center">
                                {error}
                            </p>
                            <p className="mt-4 text-sm text-muted-foreground text-center">
                                Please check your email again or restart the registration process from the <Link href="/register" className="font-semibold text-primary hover:underline">register page</Link>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <Footer/>
            </>
        );
    }

    // Main form render
    return (
        <>
            <Head>
                <title>Complete Registration | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background px-4 py-4">
                <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Complete Registration</CardTitle>
                        <CardDescription>
                            Registering account for <strong>{email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit} noValidate>
                        <CardContent className="grid gap-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            
                            {/* First Name Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    autoComplete="given-name"
                                    required
                                />
                            </div>
                            
                            {/* Password Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    placeholder="Enter strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            
                            {/* Password Requirements */}
                            <div className="grid gap-2 p-2 rounded-lg border border-border bg-card">
                                <h3 className={`font-semibold text-sm ${isPasswordStrong ? 'text-green-500' : 'text-foreground'}`}>
                                    {isPasswordStrong ? 'Strong Password' : 'Password Requirements:'}
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-y-1 gap-x-4">
                                    <PasswordRequirement met={criteria.minLength} text="Minimum 8 characters" />
                                    <PasswordRequirement met={criteria.hasUpperCase} text="1 Uppercase letter" />
                                    <PasswordRequirement met={criteria.hasLowerCase} text="1 Lowercase letter" />
                                    <PasswordRequirement met={criteria.hasNumber} text="1 Number" />
                                    <PasswordRequirement met={criteria.hasSpecialChar} text="1 Special character" />
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <PasswordInput
                                    id="confirm-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
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
                                className="w-full cursor-pointer" 
                                disabled={!canSubmit} 
                            >
                                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>) : "Create Account & Login"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <Footer/>
        </>
    );
}