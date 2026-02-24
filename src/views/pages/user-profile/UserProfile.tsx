import { Icon } from "@iconify/react/dist/iconify.js"
import CardBox from "src/components/shared/CardBox";
import profileImg from "src/assets/images/profile/user-1.jpg"
import { useUserProfile } from "src/hooks/useUserProfile";
import { Skeleton } from "src/components/ui/skeleton";
import { Badge } from "src/components/ui/badge";

const UserProfile = () => {
    const { profile, loading, error } = useUserProfile();

    // Get display name from email
    const displayName = profile?.email?.split('@')[0] || 'User';
    const firstName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

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
                            src={profileImg} 
                            alt="Profile" 
                            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-white shadow-md" 
                        />
                        <span className={`absolute bottom-0.5 right-0.5 lg:bottom-1 lg:right-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-white ${profile?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 lg:gap-3 mb-1 lg:mb-2">
                            <h1 className="text-lg lg:text-xl font-bold truncate">{firstName}</h1>
                            <Badge className={`text-xs lg:text-sm px-2 lg:px-3 py-0.5 lg:py-1 ${profile?.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {profile?.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                        <span className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs lg:text-sm font-medium">
                            <span className="font-bold text-sm lg:text-base">{profile?.roles?.length || 0}</span> Roles
                        </span>
                        <span className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs lg:text-sm font-medium">
                            <span className="font-bold text-sm lg:text-base">{profile?.assignments?.length || 0}</span> Assign
                        </span>
                        <span className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs lg:text-sm font-medium">
                            <span className="font-bold text-sm lg:text-base">{profile?.modules?.length || 0}</span> Modules
                        </span>
                    </div>
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
                        <div className="space-y-2 lg:space-y-3">
                            <div>
                                <p className="text-xs lg:text-sm text-gray-500 uppercase mb-1">User ID</p>
                                <p className="font-mono text-xs lg:text-sm bg-gray-100 dark:bg-gray-800 p-1.5 lg:p-2 rounded break-all">{profile?.id}</p>
                            </div>
                            <div>
                                <p className="text-xs lg:text-sm text-gray-500 uppercase mb-1">Email</p>
                                <p className="text-sm lg:text-base break-all">{profile?.email}</p>
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
