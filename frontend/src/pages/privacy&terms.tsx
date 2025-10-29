import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyAndTermsPage() {
    const router = useRouter();
    return (
        <>
            <Head>
                <title>Privacy & Terms | JobLog</title>
            </Head>
            <Header />
            <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-128px)]">
                <div className="max-w-3xl mx-auto">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-extrabold tracking-tight">Privacy & Terms</h1>
                    <p className="text-l mb-6 mt-2 text-foreground">Last updated: October 2025</p>
                    
                    <h2 className="text-3xl font-extrabold tracking-tight mb-6">1. Privacy Policy</h2>
                    <div className="space-y-6 text-muted-foreground">
                        <p>
                            JobLog is an independent software project developed and maintained by Athul Thampan. It was designed to help individuals track and manage their job applications effectively, while also serving as a demonstration of full-stack development capability.
                        </p>
                        <p>
                            JobLog collects only the information you provide, such as your name, email address, and job details (company, role, status, notes, etc.).
                        </p>
                        <p>
                            Your name and email are stored locally in your browser for display purposes, and authentication tokens are stored securely in cookies. All passwords are encrypted using strong hashing techniques (BCrypt).
                        </p>
                        <p>
                            JobLog does not use advertising, or tracking services, and no information is shared with third parties.
                        </p>
                        <p>
                            If you delete your account, all associated data will be permanently removed from the database.
                        </p>
                        
                    </div>
                    
                    <h2 className="text-3xl font-extrabold tracking-tight mt-6 mb-6">2. Terms of Use</h2>
                    <div className="space-y-6 text-muted-foreground">
                        <p>
                            JobLog is an independent project developed to showcase full-stack development capabilities and provide a practical tool for managing job applications. While fully functional and available for individual use, it is not a commercial service and may receive updates or modifications over time.
                        </p>
                        <p>
                            JobLog is provided without warranty or guarantee of data retention. The developer is not responsible for any loss of information, account access, or downtime. By using JobLog, you acknowledge that all data you enter is your own responsibility.
                        </p>
                        <p>
                            JobLog and its Chrome extension are independently developed applications intended for personal use. They are provided as non-commercial software without any warranties.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}