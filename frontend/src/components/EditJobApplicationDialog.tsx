import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { JobApplicationService } from "@/services/api";
import { JobApplication, UpdateJobApplicationRequest } from "@/types/types";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// List of all statuses (Must match the list in JobApplicationTable for consistency)
const ALL_STATUSES = [
  'Applied', 
  'Offer', 
  'Mid-stage Interview', 
  'Rejected', 
  'Ghosted',
  'OA Interview', 
  'Final Interview'
];

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
  status: z.string().min(1, {
      message: "Please select the current status."
  })
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
            jobPostingURL: job.jobPostingURL || "", // Convert null to empty string for the input field
            notes: job.notes || "",
            status: job.status,
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
                status: values.status, 
            };
            
            const updatedJob = await JobApplicationService.updateJobApplication(updateData);
            
            // Success: Notify parent component, close modal
            onJobUpdated(updatedJob); 
            onClose();

            toast.success("Application Updated! ✅", {
                description: `${updatedJob.role} at ${updatedJob.company} saved successfully.`,
            });

        } catch (error) {
            // Error: Show error toast (will catch backend validation errors)
            const errorMessage = (error instanceof Error) 
                ? error.message 
                : typeof error === 'string' ? error : "Failed to update job application. Please check status rules.";
            
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
                </DialogHeader>
                <div className="text-sm text-muted-foreground mb-4 -mt-3">
                    Applied on: {formattedDateApplied}
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
                                            <Input placeholder="Company Name" {...field} />
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
                                            <Input placeholder="Job Title" {...field} />
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
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {/* Status Field */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="capitalize">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALL_STATUSES.map(s => (
                                                <SelectItem key={s} value={s} className="capitalize">
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    <div className="text-xs text-orange-500 mt-1">
                                        Warning: Status changes are validated and cannot be moved backwards in the interview stages.
                                    </div>
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
                                        <Textarea rows={4} placeholder="Detailed notes about interviews, salary, feedback, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
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