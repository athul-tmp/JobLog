import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailChangePage() {
    const router = useRouter();
    const { logout } = useAuth();
    const { userId: userIdQuery, token: tokenQuery } = router.query;
    
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!router.isReady) return;

        const userId = Array.isArray(userIdQuery) ? parseInt(userIdQuery[0]) : parseInt(userIdQuery as string);
        const token = Array.isArray(tokenQuery) ? tokenQuery[0] : tokenQuery;
        
        // Validation check for parameters
        if (!userId || isNaN(userId) || !token) {
            setMessage("The verification link is invalid or missing required user ID or token parameters.");
            setStatus('error');
            setIsLoading(false);
            return;
        }

        // Call API to complete the email change
        const completeChange = async () => {
            try {
                const successMessage = await AuthService.completeEmailChange({ userId, token });
                
                setStatus('success');
                setMessage(successMessage);

                logout();
                
            } catch (err) {
                const errorMessage = typeof err === 'string' 
                    ? err 
                    : "An unexpected error occurred during email change confirmation.";
                
                setStatus('error');
                setMessage(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        completeChange();
        
    }, [router.isReady, userIdQuery, tokenQuery, logout]);

    // Show loading spinner while processing the link
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-3 text-lg text-muted-foreground">Verifying email change...</p>
            </div>
        );
    }

    // Determine the action button based on the verification status
    const ActionButton = () => {
        if (status === 'success') {
            return (
                <Link href="/login" className="w-full" passHref>
                    <Button className="w-full" size="lg">
                        Proceed to Login
                    </Button>
                </Link>
            );
        } else {
            // User is still logged in, allow them to return to settings
            return (
                <Link href="/settings" className="w-full" passHref>
                    <Button className="w-full" size="lg" variant="default">
                        Go Back
                    </Button>
                </Link>
            );
        }
      }

    return (
        <>
            <Head>
                <title>Email Verification | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background px-4">
                <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                            {status === 'success' ? 'Email Changed Successfully' : 'Verification Failed'}
                        </CardTitle>
                        <CardDescription>
                            {status === 'success' 
                                ? 'Your email address has been updated.' 
                                : 'There was an issue processing your request.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Alert 
                            variant={status === 'success' ? 'default' : 'destructive'}
                            className={status === 'success' ? 'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200' : ''}
                        >
                            {status === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                            <AlertDescription className="text-bg">{message}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <ActionButton />
                    </CardFooter>
                </Card>
            </div>
            <Footer/>
        </>
    );
}