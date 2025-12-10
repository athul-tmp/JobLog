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
                    <p className="text-l mb-6 mt-2 text-foreground">Last updated: December 2025</p>
                    
                    <h2 className="text-3xl font-extrabold tracking-tight mb-6">1. Privacy Policy</h2>
                    <div className="space-y-6 text-muted-foreground">
                        <p>
                            JobLog is an independent software project developed and maintained by Athul Thampan. It is designed to help individuals track and manage job applications effectively, while also demonstrating full-stack development capability.
                        </p>
                        <p>
                            JobLog collects only the information you choose to provide, such as your name, email address, and job-related details (e.g., company, role, status, notes). Your email may be used for account authentication, including registration confirmation, login, and password reset.
                        </p>
                        <p>
                            The JobLog: Quick Add Chrome Extension collects job-related details (Role, Company, and URL) by scraping the content of supported third-party job board websites (e.g., LinkedIn, Seek, Indeed) at the user&apos;s request. This scraped data is immediately transmitted via secure HTTPS to the JobLog API for storage in the user&apos;s private account.
                        </p>
                        <p>
                            Authentication tokens are stored securely in cookies. For the Extension, this token is stored securely in the browser&apos;s dedicated extension storage (chrome.storage.local) to maintain user authentication. Your name and email may be stored locally in your browser for display purposes. All passwords are encrypted using strong hashing techniques (BCrypt).
                        </p>
                        <p>
                            JobLog does not use advertising or tracking services, and no personal information is shared with third parties.
                        </p>
                        <p>
                            If you delete your account, all associated data will be permanently removed from the database.
                        </p>
                        
                    </div>
                    
                    <h2 className="text-3xl font-extrabold tracking-tight mt-6 mb-6">2. Terms of Use</h2>
                    <div className="space-y-6 text-muted-foreground">
                        <p>
                            JobLog is an independently developed application intended for individual use. While fully functional, it is not a commercial service and may evolve with future improvements or updates.
                        </p>
                        <p>
                            JobLog is provided without warranty or guarantee of data retention. The developer is not responsible for any loss of information, account access, or downtime. By using JobLog, you acknowledge that all data you create or enter is your own responsibility.
                        </p>
                        <p>
                            JobLog and its Chrome extension are provided as non-commercial software, without any warranties of any kind.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}