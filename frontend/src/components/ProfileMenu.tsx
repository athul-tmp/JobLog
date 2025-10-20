import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; 
import { LogOut, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 
import React from 'react';

export const ProfileMenu = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Safety check
    if (!user) return null;

    const initials = user.firstName.charAt(0).toUpperCase();

    const handleSettingsClick = () => {
        router.push('/settings'); 
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ring-2 ring-primary/60 cursor-pointer transition duration-200 ml-5">
                    <Avatar>
                        <AvatarFallback className="bg-background text-foreground/80 text-semibold hover:bg-accent">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col">
                    <span className="font-bold text-lg">Hi, {user.firstName}!</span>
                    <span className="text-sm text-muted-foreground font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Settings Option */}
                <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                {/* Log Out Option */}
                <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};