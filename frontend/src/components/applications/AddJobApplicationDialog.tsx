import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, 
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { JobApplicationService } from "@/services/api";
import { CreateJobApplicationRequest, JobApplication } from "@/types/types";
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner'; 
import { format } from 'date-fns';
import { findDuplicate } from '@/lib/duplicates';

// Schema for validation
const formSchema = z.object({
  company: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }).max(50, {
    message: "Company name must be less than 50 characters."
  }),
  role: z.string().min(2, {
    message: "Role must be at least 2 characters.",
  }).max(50, {
    message: "Role must be less than 50 characters."
  }),
  jobPostingURL: z.string().url({ message: "Must be a valid URL." }).refine((url) => /^https?:\/\//i.test(url), { message: "URL must start with http:// or https://." }).optional().or(z.literal("")),
  notes: z.string().max(500, {
    message: "Notes must be less than 500 characters."
  }).optional(),
});

interface AddJobApplicationDialogProps {
    onJobAdded: (newJob: JobApplication) => void;
    existingApplications: JobApplication[];
}

export default function AddJobApplicationDialog({ onJobAdded, existingApplications }: AddJobApplicationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company: "",
            role: "",
            jobPostingURL: "",
            notes: "",
        },
    });

    // Warns (without blocking) when the job being entered looks like one already added
    const [company, role, jobPostingURL] = form.watch(["company", "role", "jobPostingURL"]);
    const duplicate = useMemo(
        () => findDuplicate(existingApplications, { company, role, jobPostingURL }),
        [existingApplications, company, role, jobPostingURL],
    );

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const jobData: CreateJobApplicationRequest = {
                company: values.company,
                role: values.role,
                jobPostingURL: values.jobPostingURL || "",
                notes: values.notes || "",
            };
            
            const newJob = await JobApplicationService.addJobApplication(jobData);
            
            // Notify parent component, reset form, close dialog
            onJobAdded(newJob); 
            form.reset();
            setIsOpen(false);

            // Show success toast
            toast.success("Application Added!", {
                description: `Successfully added application for ${newJob.role} at ${newJob.company}.`,
                duration: 3000,
            }); 

        } catch (error) {
            // Show error toast 
            const errorMessage = (error instanceof Error) 
                ? error.message 
                : "Failed to add job application. Please try again.";
            
            toast.error("Error Adding Job", {
                description: errorMessage,
                duration: 5000,
            }); 

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="text-base shadow-md cursor-pointer">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Application
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Job Application</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new job application.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Company Field */}
                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Company Name" {...field} autoComplete="organisation"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role Field */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role/Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Job Title" {...field} autoComplete="organisation-title"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* URL Field */}
                        <FormField
                            control={form.control}
                            name="jobPostingURL"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Posting URL (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} autoComplete="url"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes Field */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Location, salary, or other details (optional)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {duplicate && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    You already added this job on {format(new Date(duplicate.dateApplied), 'd MMM yyyy')} ({duplicate.status}).
                                </span>
                            </div>
                        )}

                        <DialogFooter>
                            <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Application"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}