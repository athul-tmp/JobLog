import React, { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, AlertTriangle } from "lucide-react";

import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Email validation helper using regex
const isEmailValidFormat = (email: string) => {
    if (email.length === 0) return true; 
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regex.test(email);
};

export default function RegisterPage() {
    const router = useRouter();
    // Only keep email state
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationSentMessage, setVerificationSentMessage] = useState<string | null>(null); 
    const [registrationWarning, setRegistrationWarning] = useState<string | null>(null);
    const { isAuthenticated } = useAuth(); //

    // Redirect logic
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    // Only check email validity
    const isEmailValid = useMemo(() => isEmailValidFormat(email), [email]);
    
    // Only email and loading status affect submission
    const canSubmit = !isLoading && isEmailValid && email.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerificationSentMessage(null);
        setRegistrationWarning(null);
        setIsLoading(true);

        try {
            const message = await AuthService.initiateRegistration(email);
            
            // Check the message content
            if (message.includes("already registered")) {
                setRegistrationWarning(message);
            } else {
                setVerificationSentMessage(message);
            }

            setEmail("");
        } catch (err) {
            let errorMessage = "An unexpected error occurred. Please try again.";
            
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
    
    // Render the warning state first if present
    if (registrationWarning) {
        return (
            <>
                <Head><title>Register | JobLog</title></Head>
                <Header/>
                <div className="flex justify-center items-center min-h-screen bg-background px-4 py-4">
                    <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl font-extrabold text-foreground">Account Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-left text-bg">
                                    {registrationWarning} 
                                </AlertDescription>
                            </Alert>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Please proceed to the login page.
                            </p>
                            <Button 
                                onClick={() => router.push("/login")} 
                                className="w-full mt-4"
                            >
                                Go to Log In
                            </Button>
                        </CardContent>
                        <CardFooter>
                        </CardFooter>
                    </Card>
                </div>
                <Footer/>
            </>
        );
    }


    // Render the success state if verificationSentMessage is present
    if (verificationSentMessage) {
        return (
            <>
                <Head><title>Register | JobLog</title></Head>
                <Header/>
                <div className="flex justify-center items-center min-h-screen bg-background px-4 py-4">
                    <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl font-extrabold text-foreground">Check Your Inbox</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="default" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription className="text-left text-bg">
                                    {verificationSentMessage}
                                </AlertDescription>
                            </Alert>
                            <p className="mt-4 text-sm text-muted-foreground">
                                The link is valid for <strong>1 hour</strong>. If you don&apos;t see the email, please check your spam folder. Otherwise, you can request a new link below.
                            </p>
                            <Button 
                                onClick={() => setVerificationSentMessage(null)} 
                                variant="default" 
                                className="w-full mt-4"
                            >
                                Re-enter Email
                            </Button>
                        </CardContent>
                        <CardFooter>
                        </CardFooter>
                    </Card>
                </div>
                <Footer/>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Register | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background px-4 py-4">
                <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Registration</CardTitle>
                        <CardDescription>
                            Enter your email to receive a verification link.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit} noValidate>
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
                                    autoComplete="email"
                                    required
                                />
                                {email.length > 0 && !isEmailValid && (
                                    <p className="flex items-center text-sm mt-1 text-red-500">
                                        <AlertTriangle className="w-4 h-4 mr-1"/>
                                        Please enter a valid email.
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
                                {isLoading ? "Sending Link..." : "Send Verification Link"}
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