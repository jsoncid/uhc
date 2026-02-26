/**
 * Database Connection Form Component - Module 3
 * 
 * A form for adding new database connections with credential input
 * and connection testing before saving.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Checkbox } from 'src/components/ui/checkbox';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  Database,
  Server,
  User,
  Lock,
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  TestTube,
  Building2,
  MapPin,
  Info,
} from 'lucide-react';
import databaseService, {
  DatabaseFormData,
  DatabaseType,
  SystemType,
  DB_TYPE_OPTIONS,
  SYSTEM_TYPE_OPTIONS,
  TestConnectionResponse,
} from 'src/services/databaseService';

interface DatabaseConnectionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialFormData: DatabaseFormData = {
  host: '',
  port: '3306',
  user: '',
  password: '',
  db_name: '',
  db_type: 'mysql',
  description: '',
  facility_code: '',
  system_type: 'ihomis',
  ssl_enabled: false,
  connection_timeout: 10000,
  region: '',
};

export function DatabaseConnectionForm({ onSuccess, onCancel }: DatabaseConnectionFormProps) {
  const [formData, setFormData] = useState<DatabaseFormData>(initialFormData);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);

  // Handle input changes
  const handleInputChange = (field: keyof DatabaseFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset test result when credentials change
    if (['host', 'port', 'user', 'password', 'db_name', 'db_type', 'ssl_enabled'].includes(field)) {
      setTestResult(null);
      setConnectionTested(false);
    }
    setSaveError(null);
  };

  // Handle database type change - auto-update port
  const handleDbTypeChange = (dbType: DatabaseType) => {
    const defaultPort = databaseService.getDefaultPort(dbType);
    setFormData(prev => ({ 
      ...prev, 
      db_type: dbType,
      port: String(defaultPort),
    }));
    setTestResult(null);
    setConnectionTested(false);
  };

  // Test connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await databaseService.testConnection({
        host: formData.host,
        port: formData.port,
        user: formData.user,
        password: formData.password,
        db_name: formData.db_name,
        db_type: formData.db_type,
        ssl_enabled: formData.ssl_enabled,
      });
      
      setTestResult(result);
      setConnectionTested(result.success);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save database
  const handleSave = async () => {
    if (!connectionTested) {
      setSaveError('Please test the connection before saving');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Add the database
      const result = await databaseService.addDatabase(formData);

      if (result.success) {
        // Auto-activate and refresh pools
        if (result.data?.id) {
          await databaseService.toggleDatabaseStatus(result.data.id);
        }
        await databaseService.refreshPools();
        
        // Reset form and notify parent
        setFormData(initialFormData);
        setTestResult(null);
        setConnectionTested(false);
        onSuccess?.();
      } else {
        setSaveError(result.message || 'Failed to save database');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save database');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if required fields are filled
  const isFormValid = 
    formData.host.trim() !== '' &&
    formData.port.trim() !== '' &&
    formData.user.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.db_name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.facility_code.trim() !== '';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Add Database Connection
        </CardTitle>
        <CardDescription>
          Enter the database credentials to connect. The connection will be tested before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Type and System Type Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db_type">Database Type</Label>
            <Select
              value={formData.db_type}
              onValueChange={(value) => handleDbTypeChange(value as DatabaseType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                {DB_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_type">System Type</Label>
            <Select
              value={formData.system_type}
              onValueChange={(value) => handleInputChange('system_type', value as SystemType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select system type" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Host and Port Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="host">Host / IP Address</Label>
            <div className="relative">
              <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="host"
                placeholder="192.168.1.100 or hostname"
                value={formData.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <div className="relative">
              <Plug className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="port"
                placeholder="3306"
                value={formData.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Username and Password Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="user"
                placeholder="Database username"
                value={formData.user}
                onChange={(e) => handleInputChange('user', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Database password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Database Name */}
        <div className="space-y-2">
          <Label htmlFor="db_name">Database Name</Label>
          <div className="relative">
            <Database className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="db_name"
              placeholder="Database name (e.g., hospital_ihomis)"
              value={formData.db_name}
              onChange={(e) => handleInputChange('db_name', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Description and Facility Code Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="description"
                placeholder="e.g., City General Hospital"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility_code">Facility Code</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="facility_code"
                placeholder="e.g., CGH001"
                value={formData.facility_code}
                onChange={(e) => handleInputChange('facility_code', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region (Optional)</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="region"
              placeholder="e.g., Region X"
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* SSL Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ssl_enabled"
            checked={formData.ssl_enabled}
            onCheckedChange={(checked) => handleInputChange('ssl_enabled', checked === true)}
          />
          <Label htmlFor="ssl_enabled" className="text-sm font-normal cursor-pointer">
            Enable SSL/TLS connection
          </Label>
        </div>

        {/* Test Connection Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={!formData.host || !formData.port || !formData.user || !formData.password || !formData.db_name || isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.success && testResult.server_info && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Server: {testResult.server_info.version} | Database: {testResult.server_info.database}
                      {testResult.connection_time && ` | Connected in ${testResult.connection_time}ms`}
                    </p>
                  )}
                  {!testResult.success && testResult.error && (
                    <p className="text-sm mt-1">{testResult.error}</p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Save Error */}
        {saveError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid || !connectionTested || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Database
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        {!connectionTested && isFormValid && (
          <p className="text-sm text-muted-foreground text-center">
            Please test the connection before saving
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default DatabaseConnectionForm;
