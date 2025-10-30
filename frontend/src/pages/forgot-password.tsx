import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { isEmailValidFormat } from "@/pages/login";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

// Schema for validation
const formSchema = z.object({
    email: z.string().email({ message: "Invalid email format." }),
});

const MAX_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    });

    // Timer effect for spam prevention
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            if (!isEmailValidFormat(values.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            const responseMessage = await AuthService.forgotPassword({ email: values.email });
            setSuccessMessage(responseMessage);
            
            setCooldownSeconds(MAX_COOLDOWN_SECONDS);
            // Clear form after success
            form.reset();

        } catch {
            setSuccessMessage("If an account exists for this email, a password reset link has been sent.");
            setCooldownSeconds(MAX_COOLDOWN_SECONDS);
            form.reset(); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Forgot Password | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background px-4">
                <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                            <CardContent className="grid gap-4">
                                {/* Success Alert */}
                                {successMessage && (
                                    <Alert className="bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200">
                                        <AlertDescription className="text-bg">{successMessage} Please check your email inbox and spam.</AlertDescription>
                                    </Alert>
                                )}

                                {/* Error Alert */}
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <FormControl>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="jobseeker@example.com"
                                                    autoComplete="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 mt-5">
                                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading || cooldownSeconds > 0}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Link...
                                        </>
                                    ) : (
                                        "Send Link to Email"
                                    )}
                                </Button>
                                <div className="text-sm text-center text-muted-foreground">
                                    <Link href="/login" className="font-semibold text-primary hover:underline">
                                        Return to Login
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
            <Footer/>
        </>
    );
}