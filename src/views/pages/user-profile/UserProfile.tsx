import { Icon } from "@iconify/react/dist/iconify.js"
import BreadcrumbComp from "src/layouts/full/shared/breadcrumb/BreadcrumbComp";
import CardBox from "src/components/shared/CardBox";
import profileImg from "src/assets/images/profile/user-1.jpg"
import { useUserProfile } from "src/hooks/useUserProfile";
import { Skeleton } from "src/components/ui/skeleton";
import { Badge } from "src/components/ui/badge";

const UserProfile = () => {
    const { profile, loading, error } = useUserProfile();

    const BCrumb = [
        {
            to: "/",
            title: "Home",
        },
        {
            title: "Userprofile",
        },
    ];

    // Get display name from email
    const displayName = profile?.email?.split('@')[0] || 'User';
    const firstName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const socialLinks = [
        // { href: "#", icon: "streamline-logos:facebook-logo-2-solid" },
        // { href: "#", icon: "streamline-logos:x-twitter-logo-solid" },
        // { href: "#", icon: "ion:logo-github" },
        // { href: "#", icon: "streamline-flex:dribble-logo-remix" },
    ];

    if (loading) {
        return (
            <>
                <BreadcrumbComp title="User Profile" items={BCrumb} />
                <div className="flex flex-col gap-6">
                    <CardBox className="p-6">
                        <div className="flex items-center gap-6">
                            <Skeleton className="w-20 h-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardBox>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <CardBox className="p-6">
                            <Skeleton className="h-6 w-48 mb-6" />
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </CardBox>
                        <CardBox className="p-6">
                            <Skeleton className="h-6 w-48 mb-6" />
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </CardBox>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <BreadcrumbComp title="User Profile" items={BCrumb} />
                <CardBox className="p-6">
                    <p className="text-red-500">Error loading profile: {error.message}</p>
                </CardBox>
            </>
        );
    }

    return (
        <>
            <BreadcrumbComp title="User Profile" items={BCrumb} />
            <div className="flex flex-col gap-6">
                {/* Header Card */}
                <CardBox className="p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full break-words">
                        <div>
                            <img src={profileImg} alt="image" width={80} height={80} className="rounded-full" />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full">
                            <div className="flex flex-col sm:text-left text-center gap-1.5">
                                <h5 className="card-title">{firstName}</h5>
                                <div className="flex flex-wrap items-center gap-1 md:gap-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
                                    <div className="hidden h-4 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                    <Badge className={profile?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {profile?.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {socialLinks.map((item, index) => (
                                    <a key={index} href={item.href} target="_blank" className="flex h-11 w-11 items-center justify-center gap-2 rounded-full shadow-md border border-ld hover:bg-gray-50 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                                        <Icon icon={item.icon} width="20" height="20" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardBox>

                {/* User Info & Roles */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <CardBox className="p-6 overflow-hidden">
                        <h5 className="card-title mb-6">User Information</h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32 mb-6">
                            <div><p className="text-xs text-gray-500">User ID</p><p className="text-sm font-mono break-all">{profile?.id}</p></div>
                            <div><p className="text-xs text-gray-500">Email</p><p>{profile?.email}</p></div>
                            <div><p className="text-xs text-gray-500">Status</p>
                                <Badge className={profile?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                    {profile?.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                    </CardBox>

                    <CardBox className="p-6 overflow-hidden">
                        <h5 className="card-title mb-6">Assigned Roles</h5>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {profile?.roles && profile.roles.length > 0 ? (
                                profile.roles.map((role) => (
                                    <Badge key={role.id} className="bg-blue-100 text-blue-700 px-3 py-1">
                                        {role.description}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No roles assigned</p>
                            )}
                        </div>
                    </CardBox>
                </div>

                {/* Assignments & Modules */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <CardBox className="p-6 overflow-hidden">
                        <h5 className="card-title mb-6">Assignments</h5>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {profile?.assignments && profile.assignments.length > 0 ? (
                                profile.assignments.map((assignment) => (
                                    <Badge key={assignment.id} className="bg-purple-100 text-purple-700 px-3 py-1">
                                        {assignment.description}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No assignments</p>
                            )}
                        </div>
                    </CardBox>

                    <CardBox className="p-6 overflow-hidden">
                        <h5 className="card-title mb-6">Module Access</h5>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {profile?.modules && profile.modules.length > 0 ? (
                                profile.modules.map((module) => (
                                    <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="font-medium">{module.description}</span>
                                        <div className="flex gap-1">
                                            {module.permissions.is_select && <Badge className="bg-green-100 text-green-700 text-xs">Select</Badge>}
                                            {module.permissions.is_insert && <Badge className="bg-blue-100 text-blue-700 text-xs">Insert</Badge>}
                                            {module.permissions.is_update && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Update</Badge>}
                                            {module.permissions.is_delete && <Badge className="bg-red-100 text-red-700 text-xs">Delete</Badge>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No module access</p>
                            )}
                        </div>
                    </CardBox>
                </div>
            </div>
        </>
    );
};

export default UserProfile;
