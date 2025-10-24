import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/api'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { PasswordInput } from '../ui/PasswordInput';

// Renders the status (success/error)
const StatusAlert = ({ status, message }: { status: 'success' | 'error' | null, message: string | null }) => {
    if (!status || !message) return null;
    
    return (
        <Alert variant={status === 'error' ? 'destructive' : 'default'} className={status === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-300 border-red-500 text-red-700'}>
            {status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className={status === 'success' ? 'text-green-700' : ''}>{message}</AlertDescription>
        </Alert>
    );
};

// Password strength validation helper
const isPasswordStrong = (pw: string) => {
    return pw.length >= 8 && 
           /[A-Z]/.test(pw) && 
           /[a-z]/.test(pw) && 
           /[0-9]/.test(pw) && 
           /[#?!@$%^&*-]/.test(pw);
};

// Email validation helper
const isEmailValidFormat = (email: string) => {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regex.test(email);
};

// Interface for props
interface ManageAccountTabProps {
    isDemoUser: boolean;
}

export const ManageAccountTab = ({ isDemoUser }: ManageAccountTabProps) => {
    const { user, logout, refreshUser } = useAuth();
    
    // States for name update 
    const [newName, setNewName] = useState(user?.firstName || '');
    const [namePassword, setNamePassword] = useState('');
    const [nameStatus, setNameStatus] = useState<'success' | 'error' | null>(null);
    const [nameMessage, setNameMessage] = useState<string | null>(null);
    const [nameLoading, setNameLoading] = useState(false);

    // States for email update 
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailStatus, setEmailStatus] = useState<'success' | 'error' | null>(null);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    // States for password update
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<'success' | 'error' | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    
    // States for deletion
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteStatus, setDeleteStatus] = useState<'error' | null>(null);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Validation for button enablement
    const isNameChangedAndAuthProvided = !isDemoUser && newName.trim() !== user?.firstName && newName.trim().length > 0 && namePassword.length > 0;
    
    const isEmailChangedAndAuthProvided = !isDemoUser && newEmail !== user?.email && isEmailValidFormat(newEmail) && emailPassword.length > 0;

    const isPasswordFormReady = !isDemoUser && currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword && isPasswordStrong(newPassword);

    // Function to clear all status messages
    const clearAllStatus = () => {
        setNameStatus(null); 
        setNameMessage(null);
        setEmailStatus(null);
        setEmailMessage(null);
        setPasswordStatus(null);
        setPasswordMessage(null);
        setDeleteStatus(null);
        setDeleteMessage(null);
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameStatus(null);
        setNameMessage(null);
        setNameLoading(true);

        if (!newName.trim() || !namePassword) {
            setNameStatus('error');
            setNameMessage('First Name and Password are required.');
            setNameLoading(false);
            return;
        }

        try {
            await AuthService.updateName({ 
                currentPassword: namePassword, 
                newFirstName: newName 
            });

            // Update state and localStorage immediately
            if (user) {
                refreshUser({ firstName: newName });
            }

            setNameStatus('success');
            setNameMessage('First name updated successfully.');
            setNamePassword('');
        } catch (error) {
            setNameStatus('error');
            setNameMessage(typeof error === 'string' ? error : 'Failed to update name. Check your current password.');
        } finally {
            setNameLoading(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailStatus(null);
        setEmailMessage(null);
        setEmailLoading(true);

        if (!newEmail || !emailPassword) {
            setEmailStatus('error');
            setEmailMessage('Email and Password are required.');
            setEmailLoading(false);
            return;
        }

        if (!isEmailValidFormat(newEmail)) {
            setEmailStatus('error');
            setEmailMessage('Please enter a valid email address.');
            setEmailLoading(false);
            return;
        }

        try {
            await AuthService.updateEmail({ 
                currentPassword: emailPassword, 
                newEmail: newEmail 
            });

            // Update state and localStorage immediately
            if (user) {
                refreshUser({ email: newEmail });
            }

            setEmailStatus('success');
            setEmailMessage('Email updated successfully. You will use this email to log in next time.');
            setEmailPassword('');
        } catch (error) {
            setEmailStatus('error');
            setEmailMessage(typeof error === 'string' ? error : 'Failed to update email. Check your current password.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus(null);
        setPasswordMessage(null);
        setPasswordLoading(true);

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordStatus('error');
            setPasswordMessage('All password fields are required.');
            setPasswordLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordStatus('error');
            setPasswordMessage('New passwords do not match.');
            setPasswordLoading(false);
            return;
        }

        if (!isPasswordStrong(newPassword)) {
            setPasswordStatus('error');
            setPasswordMessage('New password does not meet strength requirements.');
            setPasswordLoading(false);
            return;
        }

        try {
            await AuthService.updatePassword({ 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            });

            // Show the success toast 
            toast.success("Password updated successfully.", {
                description: "Please log in with your new password.",
                duration: 5000,
            });

            // Clear passwords from state
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            
            // Force logout 
            logout();

        } catch (error) {
            setPasswordStatus('error');
            setPasswordMessage(typeof error === 'string' ? error : 'Failed to update password. Check your current password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    // Function executed when user confirms deletion inside the modal
    const confirmDeleteAction = async () => {
        setDeleteStatus(null);
        setDeleteMessage(null);
        setDeleteLoading(true);
        
        try {
            await AuthService.deleteAccount({ currentPassword: deletePassword });
            
            // Show toast before forced logout
            toast.success("Account successfully deleted.", {
                description: "We're sorry to see you go.",
                duration: 5000,
            });

            // Close modal before logout/redirect
            setIsDeleteModalOpen(false); 
            
            // Force logout
            logout(); 
        } catch (error) {
            setDeleteStatus('error');
            setDeleteMessage(typeof error === 'string' ? error : 'Deletion failed due to a server error.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // To open delete dialog
    const handleDeleteButton = async () => {
        clearAllStatus();
        setDeleteStatus(null); 
        setDeleteMessage(null);
        
        if (!deletePassword) {
            setDeleteStatus('error');
            setDeleteMessage('Current password is required.');
            return;
        }
        
        setDeleteLoading(true);

        try {
            // Verify password
            await AuthService.verifyPassword({ currentPassword: deletePassword });
            setIsDeleteModalOpen(true);
        } catch (error) {
            setDeleteStatus('error');
            setDeleteMessage(typeof error === 'string' ? error : 'Invalid current password. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Update Name */}
            <Card>
                <CardHeader>
                    <CardTitle>Update First Name</CardTitle>
                    <CardDescription>
                        This is the name used to greet you across the application. Changing your email requires your current password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateName}>
                    <CardContent className="space-y-4">
                        <StatusAlert status={nameStatus} message={nameMessage} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-name">First Name</Label>
                                <Input
                                    id="new-name"
                                    type="text"
                                    value={newName}
                                    disabled={isDemoUser}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name-password">Current Password (Required)</Label>
                                <PasswordInput
                                    id="name-password"
                                    value={namePassword}
                                    disabled={isDemoUser}
                                    onChange={(e) => {
                                        setNamePassword(e.target.value);
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end mt-5">
                        <Button 
                            variant="outline" 
                            className="cursor-pointer" 
                            type="submit" 
                            disabled={nameLoading || !isNameChangedAndAuthProvided || isDemoUser}
                        >
                            {nameLoading ? 'Updating...' : 'Update Name'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Update Email */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Email Address</CardTitle>
                    <CardDescription>
                        Your current email is: <strong>{user?.email}</strong>. Changing your email requires your current password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateEmail}>
                    <CardContent className="space-y-4">
                        <StatusAlert status={emailStatus} message={emailMessage} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email">Email</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    value={newEmail}
                                    disabled={isDemoUser}
                                    className={!isEmailValidFormat(newEmail) ? 'border-red-500' : ''}
                                    onChange={(e) => {
                                        setNewEmail(e.target.value);
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-password">Current Password (Required)</Label>
                                <PasswordInput
                                    id="email-password"
                                    value={emailPassword}
                                    disabled={isDemoUser}
                                    onChange={(e) => {
                                        setEmailPassword(e.target.value);
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end mt-5">
                        <Button 
                            variant="outline"
                            className="cursor-pointer"
                            type="submit"
                            disabled={emailLoading || !isEmailChangedAndAuthProvided || isDemoUser}
                        >
                            {emailLoading ? 'Changing Email...' : 'Change Email'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Update Password */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        To change your password, you must verify your current password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                    <CardContent className="space-y-4">
                        <StatusAlert status={passwordStatus} message={passwordMessage} />
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password (Required)</Label>
                            <PasswordInput
                                id="current-password"
                                value={currentPassword}
                                disabled={isDemoUser}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    clearAllStatus();
                                }}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <PasswordInput
                                    id="new-password"
                                    value={newPassword}
                                    disabled={isDemoUser}
                                    className={newPassword.length > 0 && !isPasswordStrong(newPassword) ? 'border-yellow-500' : ''}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value)
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                <PasswordInput
                                    id="confirm-new-password"
                                    value={confirmNewPassword}
                                    disabled={isDemoUser}
                                    className={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? 'border-red-500' : ''}
                                    onChange={(e) => {
                                        setConfirmNewPassword(e.target.value);
                                        clearAllStatus();
                                    }}
                                />
                            </div>
                        </div>
                        {newPassword && !isPasswordStrong(newPassword) && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Password requires 8+ chars, upper/lower case, number, and special character.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end mt-5">
                        <Button 
                            variant="outline"
                            className="cursor-pointer"
                            type="submit" 
                            disabled={passwordLoading || !isPasswordFormReady || isDemoUser}
                        >
                            {passwordLoading ? 'Changing Password...' : 'Change Password'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-500/50 bg-red-200 dark:bg-red-950/40">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Delete Account</CardTitle>
                    <CardDescription className="text-red-500 dark:text-red-300">
                        This action is permanent and cannot be undone. Your account and all your job applications will be permanently deleted.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <StatusAlert status={deleteStatus} message={deleteMessage} /> 
                    
                    <div className="space-y-2">
                        <Label htmlFor="delete-password" className="text-red-700 dark:text-red-400">Current Password (Required to confirm deletion)</Label>
                        <PasswordInput
                            id="delete-password"
                            value={deletePassword}
                            disabled={isDemoUser}
                            onChange={(e) => {
                                setDeletePassword(e.target.value);
                                clearAllStatus();
                            }}
                            className="border-red-500 focus-visible:ring-red-500"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button 
                        onClick={handleDeleteButton}
                        variant="destructive"
                        disabled={deleteLoading || !deletePassword || isDemoUser}
                    >
                        {deleteLoading ? 'Verifying...' : 'Delete Account'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Delete account confirmation dialog */}
            <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <AlertDialogContent className="z-[9999]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center">
                           <Trash2 className="w-5 h-5 mr-2" /> Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account, including all your job applications history and analytics data.
                            <p className="mt-3 font-semibold">To proceed, please click &quot;Confirm Deletion&quot;</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {deleteMessage && deleteStatus === 'error' && (
                        <Alert variant="destructive">
                            <AlertDescription>{deleteMessage}</AlertDescription>
                        </Alert>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading} onClick={() => {
                            setDeleteStatus(null); 
                            setDeleteMessage(null);
                        }}>Cancel</AlertDialogCancel>
                        <Button 
                            onClick={confirmDeleteAction} 
                            variant="destructive"
                            disabled={deleteLoading || isDemoUser}
                        >
                            {deleteLoading ? 'Processing...' : 'Confirm Deletion'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};