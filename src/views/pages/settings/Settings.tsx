import { Icon } from "@iconify/react/dist/iconify.js";
import CardBox from "src/components/shared/CardBox";
import { useTheme } from "src/components/provider/theme-provider";
import { Label } from "src/components/ui/label";
import { Switch } from "src/components/ui/switch";

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const handleThemeToggle = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

    return (
        <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] flex flex-col gap-4 lg:gap-5 overflow-auto">
            <div className="flex items-center gap-3 mb-2">
                <Icon icon="solar:settings-bold-duotone" className="w-8 h-8 text-primary" />
                <h4 className="text-xl lg:text-2xl font-semibold">Settings</h4>
            </div>

            {/* Appearance Settings */}
            <CardBox className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon icon="solar:pallete-2-bold-duotone" className="w-6 h-6 text-primary" />
                    <h5 className="text-lg font-semibold">Appearance</h5>
                </div>

                <div className="space-y-6">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                {isDarkMode ? (
                                    <Icon icon="solar:moon-bold" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Icon icon="solar:sun-bold" className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                )}
                            </div>
                            <div>
                                <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">
                                    Dark Mode
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="dark-mode"
                            checked={isDarkMode}
                            onCheckedChange={handleThemeToggle}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    {/* Theme Preview */}
                    <div className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">Current Theme Preview</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border-2 border-primary bg-white dark:bg-gray-900">
                                <div className="space-y-2">
                                    <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div className="h-8 w-full bg-primary rounded mt-3"></div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div className="space-y-2">
                                    <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    <div className="flex gap-2 mt-3">
                                        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBox>

            {/* System Information */}
            <CardBox className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon icon="solar:info-circle-bold-duotone" className="w-6 h-6 text-primary" />
                    <h5 className="text-lg font-semibold">System Information</h5>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-muted-foreground">Current Theme</span>
                        <span className="text-sm font-medium capitalize">{theme} Mode</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-muted-foreground">Version</span>
                        <span className="text-sm font-medium">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </CardBox>
        </div>
    );
};

export default Settings;
