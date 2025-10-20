import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, authLoading } = useAuth();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    
    const registrationSuccess = router.query.success === 'registered';
    
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic input validation
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        const errorMessage = await login(email, password);

        if (errorMessage) {
            setError(errorMessage);
            return; 
        }

        // Success
        router.push("/dashboard");
    };

    return (
        <>
            <Head>
                <title>Login | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Card 
                    className="w-[400px] shadow-2xl ring-2 ring-primary/40 dark:shadow-none"
                >
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-extrabold text-foreground">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to view and update your job applications.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4">
                            {/* Success Alert (from Register Page redirect) */}
                            {registrationSuccess && (
                                <Alert className="bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    <AlertTitle>Success!</AlertTitle>
                                    <AlertDescription>
                                        Your account has been created. Please log in.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error} Please try again.</AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="jobseeker@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 mt-5">
                            <Button type="submit" className="w-full cursor-pointer" disabled={authLoading}>
                                {authLoading ? "Logging In..." : "Log In"}
                            </Button>
                            <div className="text-sm text-center text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="font-semibold text-primary hover:underline">
                                    Sign Up
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