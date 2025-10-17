import { useState, useEffect } from 'react';
import { JobApplication } from "@/types/types";
import { format } from "date-fns";
import { ArrowUpDown, MoreHorizontal, Eye, Link as LinkIcon, Trash2, ChevronsRight, ChevronsLeft, Search, ListFilter } from "lucide-react";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// List of all statuses
const ALL_STATUSES = [
  'applied', 
  'offer', 
  'mid-stage interview', 
  'rejected', 
  'ghosted',
  'OA interview', 
  'final interview'
];

// Status badge colouring
const getStatusVariant = (status: string): 'applied' | 'offer' | 'interview' | 'OAInterview' | 'finalInterview' | 'rejected' | 'ghosted' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'offer':
      return 'offer'; 
    case 'mid-stage interview':
      return 'interview'; 
    case 'rejected':
      return 'rejected'
    case 'ghosted':
      return 'ghosted';
    case 'applied':
      return 'applied';
    case 'oa interview':
      return 'OAInterview';
    case 'final interview':
      return 'finalInterview';
    default:
      return 'outline';
  }
};

// Column definitions
export const columns: ColumnDef<JobApplication>[] = [

  // Application No. 
  {
    accessorKey: "applicationNo", 
    header: "Application No.",
    cell: ({ row }) => { 
        const appNo = row.getValue("applicationNo") as number;
        return <div className="text-center font-mono text-xs font-semibold text-foreground">{appNo}</div>;
    },
    size: 100, 
    enableHiding: false,
  },

  // Company Name
  {
    accessorKey: "company",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("company")}</div>,
  },

  // Role/Title
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("role")}</div>,
  },

  // Notes 
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        if (!notes) return <div className="text-muted-foreground italic">No notes</div>;
        
        // Truncate long notes for cleaner table view
        const displayNotes = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;
        
        return <div className="text-sm max-w-xs">{displayNotes}</div>;
    },
    enableHiding: true,
  },

  // Status 
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize min-w-[80px] justify-center">
            {status}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue: string[]) => {
        if (filterValue.length === 0) return true;
        const rowStatus = row.getValue(columnId) as string;
        return filterValue.includes(rowStatus.toLowerCase());
    },
  },

  // Date Applied
  {
    accessorKey: "dateApplied",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end w-full pr-0"
        >
          Date Applied
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const date = row.getValue("dateApplied") as string;
        // Format date (e.g., May 15, 2024)
        const dateObject = new Date(date);
        return dateObject.toString() !== 'Invalid Date' 
            ? <div className="text-right text-sm">{format(dateObject, "MMM d, yyyy")}</div>
            : <div className="text-right text-sm text-red-500">Invalid Date</div>;
    },
    enableHiding: true, 
  },

  // Actions Column 
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const job = row.original;
      const hasUrl = !!job.jobPostingURL;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            {/* TODO: Action to view details/edit */}
            <DropdownMenuItem
                onClick={() => console.log(`Viewing/Editing job ID: ${job.id}`)}
                className="cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2"/> View/Edit Details
            </DropdownMenuItem>

            {/* Action to open URL */}
            {hasUrl && (
                <DropdownMenuItem asChild>
                    <a href={job.jobPostingURL} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                      <LinkIcon className="w-4 h-4 mr-2"/> View Job Post
                    </a>
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Main table component
interface JobApplicationTableProps {
    data: JobApplication[];
}

export function JobApplicationTable({ data }: JobApplicationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dateApplied', desc: true }]); // Default sort by date desc
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
        pagination: {
            pageSize: 10,
        },
    },
  });
  
  // Get the current value of the main search input
  const globalFilterValue = (table.getColumn("company")?.getFilterValue() as string) ?? "";
  
  // For combined search across Company and Role
  const handleGlobalFilterChange = (value: string) => {
    table.getColumn("company")?.setFilterValue(value);
  }

  // To toggle status filter on/off
  const handleStatusToggle = (status: string, isChecked: boolean) => {
    const statusInLowercase = status.toLowerCase();

    if (isChecked) {
        setSelectedStatuses(prev => [...prev, statusInLowercase]);
    } else {
        setSelectedStatuses(prev => prev.filter(s => s !== statusInLowercase));
    }
  };

  // Sync status filter state with TanStack column filters
  useEffect(() => {
      if (selectedStatuses.length > 0) {
          table.getColumn("status")?.setFilterValue(selectedStatuses);
      } else {
          table.getColumn("status")?.setFilterValue(undefined);
      }
  }, [selectedStatuses, table]);

  return (
    <div className="w-full">
      
      {/* Filtering */}
      <div className="flex items-center py-4 justify-between">
        
        {/* Search */}
        <div className="flex items-center space-x-4">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search company or role..."
                  value={globalFilterValue}
                  onChange={(event) => handleGlobalFilterChange(event.target.value)}
                  className="w-full max-w-sm pl-9"
                />
            </div>

            {/* Status Filter Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-4 capitalize">
                        <ListFilter className="w-4 h-4 mr-2"/>
                        Status
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {ALL_STATUSES.map((status) => {
                        const isSelected = selectedStatuses.includes(status);
                        return (
                            <div 
                                key={status}
                                className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50"
                                onClick={() => handleStatusToggle(status, !isSelected)}
                            >
                                <Checkbox
                                    id={`filter-${status}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleStatusToggle(status, checked as boolean)}
                                />
                                <label 
                                    htmlFor={`filter-${status}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                >
                                    {status}
                                </label>
                            </div>
                        );
                    })}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setSelectedStatuses([])}
                        disabled={selectedStatuses.length === 0}
                        className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"
                    >
                        Clear All Filters
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      {/* Main table display */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No applications match your current search/filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}

      <div className="flex items-center justify-end space-x-2 py-4">
        
        {/* Previous/Next Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="flex items-center space-x-1"
        >
          <ChevronsLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}