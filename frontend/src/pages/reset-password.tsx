import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { AuthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useMemo } from "react";
import { Form } from "@/components/ui/form";

// Password strength pattern
const STRONG_PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.";

const formSchema = z.object({
    newPassword: z.string().regex(STRONG_PASSWORD_REGEX, {
        message: PASSWORD_REQUIREMENTS_MESSAGE
    }),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], 
});

export default function ResetPasswordPage() {
    const router = useRouter();
    const { email: queryEmail, token: queryToken } = router.query;

    const [isLoading, setIsLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
        mode: "onChange",
    });
    const { isValid } = form.formState;

    // Check for necessary URL parameters
    const isTokenValid = useMemo(() => 
        typeof queryEmail === 'string' && queryEmail.length > 0 && 
        typeof queryToken === 'string' && queryToken.length > 0, 
    [queryEmail, queryToken]);

    // Handle token validation failure on load
    useEffect(() => {
        if (router.isReady && !isTokenValid) {
            setError("The password reset link is invalid or missing required parameters.");
        }
    }, [router.isReady, isTokenValid]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!isTokenValid) {
            setError("Cannot submit: Invalid or expired reset link.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await AuthService.resetPassword({
                email: queryEmail as string,
                token: queryToken as string,
                newPassword: values.newPassword,
            });

            setResetSuccess(true);
            form.reset();

        } catch (err) {
            setError(typeof err === 'string' ? err : "Failed to reset password. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (router.isReady && !isTokenValid && !error) {
        // Fallback or a redirect if token is missing but only after router is ready
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="size-15 animate-spin"/>
            </div>
        );
    }
    
    return (
        <>
            <Head>
                <title>Reset Password | JobLog</title>
            </Head>
            <Header/>
            <div className="flex justify-center items-center min-h-screen bg-background px-4">
                <Card className="w-full max-w-sm shadow-2xl ring-2 ring-primary/40 dark:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Reset Password</CardTitle>
                        <CardDescription>
                            Create a new password for your account.
                        </CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                            <CardContent className="grid gap-4">
                                {/* Success Alert */}
                                {resetSuccess && (
                                    <Alert className="bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        <AlertTitle>Success!</AlertTitle>
                                        <AlertDescription className="text-bg">
                                            Your password has been successfully reset.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Error/Invalid Link Alert */}
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {(!error && !resetSuccess) && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <PasswordInput
                                                id="newPassword"
                                                placeholder="Enter new password"
                                                {...form.register("newPassword")}
                                                autoComplete="new-password"
                                            />
                                            {form.formState.errors.newPassword && (
                                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.newPassword.message}</p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <PasswordInput
                                                id="confirmPassword"
                                                placeholder="Confirm new password"
                                                {...form.register("confirmPassword")}
                                                autoComplete="new-password"
                                            />
                                            {form.formState.errors.confirmPassword && (
                                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
                                            )}
                                        </div>
                                    </>
                                )}

                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 mt-5">
                                {(isTokenValid && !resetSuccess && !error) && (
                                    <Button 
                                        type="submit" 
                                        className="w-full cursor-pointer" 
                                        disabled={isLoading || !isValid}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Resetting Password...
                                            </>
                                        ) : "Reset Password"}
                                    </Button>
                                )}
                                <div className="text-sm text-center text-muted-foreground">
                                    {resetSuccess ? (
                                        <Link href="/login" className="font-semibold text-primary hover:underline">
                                            Proceed to Login
                                        </Link>
                                    ) : (
                                        <Link href="/login" className="font-semibold text-primary hover:underline">
                                            Return to Login
                                        </Link>
                                    )}
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