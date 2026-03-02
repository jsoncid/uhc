import { Icon } from "@iconify/react/dist/iconify.js"
import CardBox from "src/components/shared/CardBox";
import profileImg from "src/assets/images/profile/user-1.jpg"
import { useUserProfile } from "src/hooks/useUserProfile";
import { Skeleton } from "src/components/ui/skeleton";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { userService } from "@/services/userService";
import { useRef, useState } from "react";
import { Camera, Loader2, X, User, Edit } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "src/components/ui/dialog";

const UserProfile = () => {
    const { profile, loading, error, refetch } = useUserProfile();
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get display name from email
    const displayName = profile?.email?.split('@')[0] || 'User';
    const defaultFirstName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const handleEditProfile = () => {
        // Initialize form with current values
        setFirstName(profile?.firstName || defaultFirstName);
        setLastName(profile?.lastName || '');
        setShowEditDialog(true);
        setUploadError(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (JPG, PNG, etc.)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be under 5 MB');
            return;
        }

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedFile(file);
        setUploadError(null);
    };

    const handleSaveProfile = async () => {
        if (!profile) return;

        setIsSaving(true);
        setUploadError(null);

        try {
            // Upload profile picture if selected
            if (selectedFile) {
                await userService.uploadProfilePicture(selectedFile, displayName, profile.id);
            }

            // Update name if changed
            if (firstName.trim() || lastName.trim()) {
                await userService.updateUserName(profile.id, {
                    firstName: firstName.trim() || defaultFirstName,
                    lastName: lastName.trim()
                });
            }

            // Refresh profile to get updates
            await refetch();
            
            // Close dialog and cleanup
            setShowEditDialog(false);
            handleCleanup();
        } catch (err) {
            console.error('Save error:', err);
            setUploadError(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCleanup = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancelEdit = () => {
        setShowEditDialog(false);
        handleCleanup();
        setUploadError(null);
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] flex flex-col gap-4 lg:gap-5 overflow-auto lg:overflow-hidden">
                <CardBox className="p-4 lg:p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Skeleton className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3 w-full">
                            <Skeleton className="h-6 w-32 mx-auto sm:mx-0" />
                            <Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
                        </div>
                    </div>
                </CardBox>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 min-h-0">
                    <div className="flex flex-col gap-4 lg:gap-5">
                        <CardBox className="p-4 lg:p-5"><Skeleton className="h-32" /></CardBox>
                        <CardBox className="p-4 lg:p-5"><Skeleton className="h-24" /></CardBox>
                        <CardBox className="p-4 lg:p-5"><Skeleton className="h-24" /></CardBox>
                    </div>
                    <CardBox className="p-4 lg:p-5 lg:col-span-2"><Skeleton className="h-64 lg:h-full" /></CardBox>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <CardBox className="p-5">
                <div className="flex items-center gap-3 text-red-500">
                    <Icon icon="solar:danger-circle-bold" className="w-6 h-6" />
                    <p className="text-base">Error loading profile: {error.message}</p>
                </div>
            </CardBox>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] flex flex-col gap-4 lg:gap-5 overflow-auto lg:overflow-hidden">
            {/* Profile Header */}
            <CardBox className="p-4 lg:p-5 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <img 
                            src={profile?.profilePictureUrl || profileImg} 
                            alt="Profile" 
                            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-white shadow-md object-cover" 
                        />
                        <span className={`absolute bottom-0.5 right-0.5 lg:bottom-1 lg:right-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-white ${profile?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 lg:gap-3 mb-1 lg:mb-2">
                            <h1 className="text-lg lg:text-xl font-bold truncate">
                                {profile?.firstName && profile?.lastName 
                                    ? `${profile.firstName} ${profile.lastName}`
                                    : profile?.firstName || defaultFirstName
                                }
                            </h1>
                            <Badge className={`text-xs lg:text-sm px-2 lg:px-3 py-0.5 lg:py-1 ${profile?.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {profile?.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate mb-3">{profile?.email}</p>
                    </div>

                    {/* Edit Profile Button */}
                    <Button
                        onClick={handleEditProfile}
                        size="sm"
                        className="text-xs lg:text-sm"
                    >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit Profile
                    </Button>
                </div>
            </CardBox>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 min-h-0">
                {/* Left Column - Account + Roles + Assignments */}
                <div className="flex flex-col gap-4 lg:gap-5 min-h-0 order-2 lg:order-1">
                    {/* Account Details */}
                    <CardBox className="p-4 lg:p-5">
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                            <Icon icon="solar:user-id-bold-duotone" className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                            <h5 className="font-semibold text-sm lg:text-base">Account Details</h5>
                        </div>
                        <div className="space-y-3 lg:space-y-4">
                            <div>
                                <p className="text-xs lg:text-sm text-gray-500 uppercase mb-1">User ID</p>
                                <p className="font-mono text-xs lg:text-sm bg-gray-100 dark:bg-gray-800 p-1.5 lg:p-2 rounded break-all">{profile?.id}</p>
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-500 uppercase mb-1">Email</p>
                                <p className="text-sm lg:text-base break-all">{profile?.email}</p>
                            </div>
                            
                            {/* Quick Stats */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                                        <span className="font-bold">{profile?.roles?.length || 0}</span> Roles
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                                        <span className="font-bold">{profile?.assignments?.length || 0}</span> Assign
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                                        <span className="font-bold">{profile?.modules?.length || 0}</span> Modules
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardBox>

                    {/* Assignments */}
                    <CardBox className="p-4 lg:p-5 lg:flex-1 min-h-0">
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                            <Icon icon="solar:clipboard-list-bold-duotone" className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                            <h5 className="font-semibold text-sm lg:text-base">Assignments</h5>
                        </div>
                        <div className="flex flex-wrap gap-1.5 lg:gap-2">
                            {profile?.assignments && profile.assignments.length > 0 ? (
                                profile.assignments.map((assignment) => (
                                    <Badge key={assignment.id} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium">
                                        {assignment.description}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs lg:text-sm text-gray-400 italic">No assignments</span>
                            )}
                        </div>
                    </CardBox>
                </div>

                {/* Right Column - Module Access (spans 2 cols on lg) */}
                <CardBox className="p-4 lg:p-5 lg:col-span-2 flex flex-col min-h-0 order-1 lg:order-2">
                    <div className="flex items-center gap-2 mb-3 lg:mb-4 flex-shrink-0">
                        <Icon icon="solar:shield-user-bold-duotone" className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                        <h5 className="font-semibold text-sm lg:text-base">Roles & Module Access</h5>
                        {profile?.roles && profile.roles.length > 0 && (
                            <Badge variant="outline" className="ml-auto text-xs lg:text-sm">{profile.roles.length} Roles</Badge>
                        )}
                    </div>
                    
                    {profile?.roles && profile.roles.length > 0 ? (
                        <div className="flex-1 overflow-auto min-h-0 space-y-4">
                            {profile.roles.map((role) => (
                                <div key={role.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 lg:p-4">
                                    {/* Role Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-blue-500" />
                                        <h6 className="font-semibold text-sm lg:text-base text-blue-700 dark:text-blue-400">
                                            {role.description}
                                        </h6>
                                        {role.modules && role.modules.length > 0 && (
                                            <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                                {role.modules.length} {role.modules.length === 1 ? 'Module' : 'Modules'}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Module Access Table */}
                                    {role.modules && role.modules.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Module</th>
                                                        <th className="text-center py-2 px-1 text-xs font-medium text-gray-500 uppercase w-16">View</th>
                                                        <th className="text-center py-2 px-1 text-xs font-medium text-gray-500 uppercase w-16">Create</th>
                                                        <th className="text-center py-2 px-1 text-xs font-medium text-gray-500 uppercase w-16">Edit</th>
                                                        <th className="text-center py-2 px-1 text-xs font-medium text-gray-500 uppercase w-16">Delete</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {role.modules.map((module, moduleIndex) => (
                                                        <tr key={`${role.id}-${module.id}-${moduleIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="py-2 px-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon icon="solar:widget-4-bold" className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                                    <span className="text-xs lg:text-sm">{module.description}</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-center py-2 px-1">
                                                                {module.permissions.is_select ? (
                                                                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-500 mx-auto" />
                                                                ) : (
                                                                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                                )}

            {/* Edit Profile Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Edit Profile
                        </DialogTitle>
                        <DialogDescription>
                            Update your profile information and picture.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {/* Profile Picture Section */}
                        <div className="flex flex-col items-center gap-3 pb-4 border-b">
                            <div className="relative">
                                <img
                                    src={previewUrl || profile?.profilePictureUrl || profileImg}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                                />
                                {selectedFile && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                        <Camera className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleUploadClick}
                                className="text-xs"
                            >
                                <Camera className="w-3.5 h-3.5 mr-1.5" />
                                {selectedFile ? 'Change Picture' : 'Upload Picture'}
                            </Button>
                            
                            {selectedFile && (
                                <p className="text-xs text-gray-500">
                                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                            
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Name Fields */}
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-medium">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="firstName"
                                    placeholder="Enter your first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-medium">
                                    Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    placeholder="Enter your last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {uploadError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={isSaving || !firstName.trim()}
                            className="flex-1 sm:flex-none"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
                                                            </td>
                                                            <td className="text-center py-2 px-1">
                                                                {module.permissions.is_insert ? (
                                                                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-500 mx-auto" />
                                                                ) : (
                                                                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                                )}
                                                            </td>
                                                            <td className="text-center py-2 px-1">
                                                                {module.permissions.is_update ? (
                                                                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-500 mx-auto" />
                                                                ) : (
                                                                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                                )}
                                                            </td>
                                                            <td className="text-center py-2 px-1">
                                                                {module.permissions.is_delete ? (
                                                                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-500 mx-auto" />
                                                                ) : (
                                                                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">
                                            <p className="text-xs">No modules assigned to this role</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 py-8">
                            <div className="text-center">
                                <Icon icon="solar:shield-user-line-duotone" className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 opacity-50" />
                                <p className="text-xs lg:text-sm">No roles assigned</p>
                            </div>
                        </div>
                    )}
                </CardBox>
            </div>
        </div>
    );
};

export default UserProfile;
