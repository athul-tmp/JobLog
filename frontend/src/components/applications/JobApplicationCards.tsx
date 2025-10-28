import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { JobApplication, UpdateJobApplicationRequest } from "@/types/types";
import { format } from "date-fns";
import { Search, ListFilter, RotateCcw, Link as LinkIcon, ChevronsRight, ChevronsLeft, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { JobApplicationService } from "@/services/api";
import { toast } from 'sonner';
import { useStatusValidation } from "@/hooks/useStatusValidation"; 


// List of all statuses
const ALL_STATUSES = [
    'applied', 
    'offer', 
    'mid-stage interview', 
    'rejected', 
    'ghosted',
    'oa interview', 
    'final interview'
];

// Helper to format the status string for display with correct capitalisation
const getDisplayStatus = (status: string) => {
    if (status.toLowerCase() === 'oa interview') return 'OA Interview';
    return status.replace(/\b\w/g, c => c.toUpperCase());
};

// Status badge colouring
const getStatusVariant = (status: string): 'applied' | 'offer' | 'interview' | 'OAInterview' | 'finalInterview' | 'rejected' | 'ghosted' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'offer': return 'offer'; 
    case 'mid-stage interview': return 'interview'; 
    case 'rejected': return 'rejected'
    case 'ghosted': return 'ghosted';
    case 'applied': return 'applied';
    case 'oa interview': return 'OAInterview';
    case 'final interview': return 'finalInterview';
    default: return 'outline';
  }
};

// Reusable component to display status with color
const StatusDisplay = ({ status }: { status: string }) => (
    <Badge variant={getStatusVariant(status)} className="capitalize min-w-[100px] justify-center">
        {getDisplayStatus(status)}
    </Badge>
);

interface JobApplicationCardsProps {
    data: JobApplication[];
    onJobUpdated: (updatedJob: JobApplication) => void;
    onOpenEditModal: (job: JobApplication) => void;
    onUndoStatusChange: (jobId: number) => Promise<void>;
}

// Card component for individual job application
const JobCard: React.FC<{ job: JobApplication, props: Omit<JobApplicationCardsProps, 'data'> }> = ({ job, props }) => {
    const { getValidNextStatuses } = useStatusValidation(); 
    const validStatuses = getValidNextStatuses(job.status);
    
    // Ensure current status is available for selection
    if (!validStatuses.includes(job.status)) {
        validStatuses.push(job.status);
        validStatuses.sort((a, b) => ALL_STATUSES.indexOf(a.toLowerCase()) - ALL_STATUSES.indexOf(b.toLowerCase()));
    }
    
    const handleSelectChange = async (newStatus: string) => {
        if (newStatus === job.status) return;

        try {
          const updateData: UpdateJobApplicationRequest = {
            id: job.id,
            status: newStatus,
          };
          
          const updatedJob = await JobApplicationService.updateJobApplication(updateData);
          props.onJobUpdated(updatedJob);

          toast.success("Status Updated", {
            description: `${job.company} status changed to ${newStatus}.`,
          });

        } catch (error) {
          const errorMessage = (error instanceof Error) 
            ? error.message 
            : typeof error === 'string' ? error : "Status change blocked by progression rules.";
          
          toast.error("Status Change Blocked", {
            description: errorMessage,
          });
        }
    };
    
    const hasUrl = !!job.jobPostingURL;
    const canUndo = job.statusHistory.length > 1;

    return (
        <Card className="ring-1 ring-border/50 hover:ring-primary/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col">
                    <CardTitle className="text-lg font-bold">
                        {job.company}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {job.role}
                    </CardDescription>
                </div>
                <Badge variant={getStatusVariant(job.status)} className="flex-shrink-0">
                    {getDisplayStatus(job.status)}
                </Badge>
            </CardHeader>
            
            <CardContent className="space-y-3 p-4 pt-0 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                    <span># {job.applicationNo}</span>
                    <span>Applied: {format(new Date(job.dateApplied), "MMM d, yyyy")}</span>
                </div>
                <p className="text-foreground line-clamp-2">
                    {job.notes || <span className="italic text-muted-foreground">No notes available.</span>}
                </p>
            </CardContent>

            <CardFooter className="flex justify-between gap-2 p-4 pt-0 border-t border-border/80">
                
                {/* Status update */}
                <Select value={job.status} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <StatusDisplay status={job.status} /> 
                    </SelectTrigger>
                    <SelectContent>
                        {validStatuses.map(s => ( 
                          <SelectItem 
                              className="cursor-pointer" 
                              key={s} 
                              value={s} 
                          >
                            <StatusDisplay status={s} />
                          </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                {/* Action button */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 p-0 cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                            onClick={() => props.onOpenEditModal(job)}
                            className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2"/> View/Edit Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                            onClick={() => props.onUndoStatusChange(job.id)}
                            disabled={!canUndo}
                            className={`cursor-pointer ${canUndo ? 'text-orange-500' : 'text-muted-foreground/50'}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-2"/> Undo Last Status
                        </DropdownMenuItem>

                        {hasUrl && (
                            <DropdownMenuItem asChild>
                                <a href={job.jobPostingURL} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                  <LinkIcon className="w-4 h-4 mr-2"/> View Job Post
                                </a>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};


export const JobApplicationCards: React.FC<JobApplicationCardsProps> = (props) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const CARDS_PER_PAGE = 5;

    // Filtered and Sorted Data
    const filteredApplications = useMemo(() => {
        const term = searchTerm.toLowerCase();
        
        // Filtering by search term (company or role)
        let filtered = props.data.filter(app => 
            app.company.toLowerCase().includes(term) || app.role.toLowerCase().includes(term)
        );

        // Filtering by status
        if (selectedStatus && selectedStatus !== 'all') {
            filtered = filtered.filter(app => app.status.toLowerCase() === selectedStatus.toLowerCase());
        }
        
        return filtered;
    }, [props.data, searchTerm, selectedStatus]);

    // Pagination logic
    const totalPages = Math.ceil(filteredApplications.length / CARDS_PER_PAGE);
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const currentCards = filteredApplications.slice(startIndex, startIndex + CARDS_PER_PAGE);

    const goToPreviousPage = useCallback(() => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    }, []);

    const goToNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }, [totalPages]);
    
    // Reset page on filter/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, totalPages]);
    
    return (
        <div className="space-y-6">
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-x-0 sm:space-x-4 gap-2">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search company or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9"
                    />
                </div>

                {/* Status Filter Select */}
                <div className="flex-shrink-0 w-full sm:w-[200px]">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9 px-4 capitalize cursor-pointer">
                            <ListFilter className="w-4 h-4 mr-2"/>
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {ALL_STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="cursor-pointer">
                                    {getDisplayStatus(s)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Card Grid */}
            <div className="grid gap-4">
                {currentCards.length > 0 ? (
                    currentCards.map(job => (
                        <JobCard key={job.id} job={job} props={props} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No applications match your current search/filters.
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredApplications.length > CARDS_PER_PAGE && (
                <div className="flex items-center justify-between py-4 border-t border-border/80">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({filteredApplications.length} total applications)
                    </div>
                    <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                            <span>Next</span>
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};