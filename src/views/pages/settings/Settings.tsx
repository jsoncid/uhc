import { Icon } from "@iconify/react/dist/iconify.js";
import CardBox from "src/components/shared/CardBox";
import { useTheme } from "src/components/provider/theme-provider";
import { Label } from "src/components/ui/label";
import { Switch } from "src/components/ui/switch";
import { Button } from "src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select";
import { useSettings } from "src/context/SettingsContext";

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { settings, updateSetting, resetSettings } = useSettings();

    const handleThemeToggle = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            resetSettings();
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] flex flex-col gap-4 lg:gap-5 overflow-auto pb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="solar:settings-bold-duotone" className="w-8 h-8 text-primary" />
                    <h4 className="text-xl lg:text-2xl font-semibold">Settings</h4>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleResetSettings} variant="outline" size="sm">
                        <Icon icon="solar:restart-bold" className="w-4 h-4 mr-2" />
                        Reset to Defaults
                    </Button>
                </div>
            </div>

            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p>Settings are automatically saved and applied immediately. Changes will persist across sessions.</p>
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

                    {/* Compact Mode */}
                    <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <Icon icon="solar:minimize-square-bold" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <Label htmlFor="compact-mode" className="text-base font-medium cursor-pointer">
                                    Compact Mode
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Reduce spacing and padding for more content
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="compact-mode"
                            checked={settings.display.compactMode}
                            onCheckedChange={(checked) => updateSetting('display', 'compactMode', checked)}
                        />
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Icon icon="solar:text-bold" className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <Label className="text-base font-medium">Font Size</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Adjust text size across the application
                                </p>
                            </div>
                        </div>
                        <Select 
                            value={settings.display.fontSize} 
                            onValueChange={(value) => updateSetting('display', 'fontSize', value as any)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table Density */}
                    <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                <Icon icon="solar:list-bold" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <Label className="text-base font-medium">Table Density</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Control row spacing in tables
                                </p>
                            </div>
                        </div>
                        <Select 
                            value={settings.display.tableDensity} 
                            onValueChange={(value) => updateSetting('display', 'tableDensity', value as any)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="comfortable">Comfortable</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardBox>

            {/* Session & Security */}
            <CardBox className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon icon="solar:shield-check-bold-duotone" className="w-6 h-6 text-primary" />
                    <h5 className="text-lg font-semibold">Session & Security</h5>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div>
                            <Label htmlFor="auto-logout" className="text-base font-medium cursor-pointer">
                                Auto Logout
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Automatically log out after inactivity
                            </p>
                        </div>
                        <Switch
                            id="auto-logout"
                            checked={settings.session.autoLogout}
                            onCheckedChange={(checked) => updateSetting('session', 'autoLogout', checked)}
                        />
                    </div>

                    {settings.session.autoLogout && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 ml-4">
                            <div>
                                <Label className="text-base font-medium">Session Timeout</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Minutes of inactivity before logout
                                </p>
                            </div>
                            <Select 
                                value={settings.session.sessionTimeout.toString()} 
                                onValueChange={(value) => updateSetting('session', 'sessionTimeout', parseInt(value))}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardBox>

            {/* Accessibility */}
            <CardBox className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon icon="solar:accessibility-bold-duotone" className="w-6 h-6 text-primary" />
                    <h5 className="text-lg font-semibold">Accessibility</h5>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div>
                            <Label htmlFor="high-contrast" className="text-base font-medium cursor-pointer">
                                High Contrast
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Increase color contrast for better visibility
                            </p>
                        </div>
                        <Switch
                            id="high-contrast"
                            checked={settings.accessibility.highContrast}
                            onCheckedChange={(checked) => updateSetting('accessibility', 'highContrast', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div>
                            <Label htmlFor="reduced-motion" className="text-base font-medium cursor-pointer">
                                Reduced Motion
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Minimize animations and transitions
                            </p>
                        </div>
                        <Switch
                            id="reduced-motion"
                            checked={settings.accessibility.reducedMotion}
                            onCheckedChange={(checked) => updateSetting('accessibility', 'reducedMotion', checked)}
                        />
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
                        <span className="text-sm font-medium capitalize flex items-center gap-2">
                            {isDarkMode ? (
                                <Icon icon="solar:moon-bold" className="w-4 h-4" />
                            ) : (
                                <Icon icon="solar:sun-bold" className="w-4 h-4" />
                            )}
                            {theme} Mode
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-muted-foreground">Application Version</span>
                        <span className="text-sm font-medium">v1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Browser</span>
                        <span className="text-sm font-medium">{navigator.userAgent.split(' ').pop()?.split('/')[0] || 'Unknown'}</span>
                    </div>
                </div>
            </CardBox>
        </div>
    );
};

export default Settings;
