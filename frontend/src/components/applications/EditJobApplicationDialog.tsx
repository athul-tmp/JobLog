import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { format } from "date-fns";
import { JobApplicationService } from "@/services/api";
import { JobApplication, UpdateJobApplicationRequest } from "@/types/types";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  jobPostingURL: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal("")),
  notes: z.string().max(500, {
    message: "Notes must be less than 500 characters."
  }).optional(),
});

interface EditJobApplicationDialogProps {
    job: JobApplication;
    isOpen: boolean;
    onClose: () => void;
    onJobUpdated: (updatedJob: JobApplication) => void;
}

// Map the job data to form schema types, handling null/string differences
type FormValues = z.infer<typeof formSchema>;

export default function EditJobApplicationDialog({ job, isOpen, onClose, onJobUpdated }: EditJobApplicationDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company: job.company,
            role: job.role,
            jobPostingURL: job.jobPostingURL || "",
            notes: job.notes || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const updateData: UpdateJobApplicationRequest = {
                id: job.id,
                company: values.company,
                role: values.role,
                jobPostingURL: values.jobPostingURL || "", 
                notes: values.notes || "",
            };
            
            const updatedJob = await JobApplicationService.updateJobApplication(updateData);
            
            // Success: Notify parent component, close modal
            onJobUpdated(updatedJob); 
            onClose();

            toast.success("Details Updated!", {
                description: `Details for ${updatedJob.company} saved successfully. Status remains ${updatedJob.status}.`,
            });

        } catch (error) {
            // Error: Show error toast
            const errorMessage = (error instanceof Error) 
                ? error.message 
                : typeof error === 'string' ? error : "Failed to update job application details.";
            
            toast.error("Update Failed", {
                description: errorMessage,
            });

        } finally {
            setIsLoading(false);
        }
    };
    
    // Calculate the date applied in a readable format
    const formattedDateApplied = format(new Date(job.dateApplied), "MMM d, yyyy 'at' h:mm a");


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Edit Application #{job.applicationNo}</DialogTitle>
                    <DialogDescription>
                        Enter the new details for the job application.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground mb-4 -mt-3">
                    Applied on: {formattedDateApplied}
                    <div className="font-semibold text-foreground capitalize">
                        Status: {job.status}
                    </div>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Company Field */}
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem className="col-span-1">
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
                                    <FormItem className="col-span-1">
                                        <FormLabel>Role/Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Job Title" {...field} autoComplete="organisation-title"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                        <Textarea rows={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}