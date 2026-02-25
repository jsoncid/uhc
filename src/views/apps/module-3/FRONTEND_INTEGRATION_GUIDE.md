# Frontend Integration Guide: Dynamic Database Connections

## Overview

This guide explains how to integrate with the UHC Backend to implement **fully dynamic database connections** where users can:
- Input database credentials through a UI form
- Connect to ANY MySQL, PostgreSQL, MariaDB, or MSSQL database
- Support different system types: **iHOMIS** and **iClinic**
- Perform patient operations (search, tagging, profiling) on connected databases

---

## 🚨 IMPORTANT: Move Away from Static/Hardcoded Connections

### ❌ The OLD Way (Static/Hardcoded) - DO NOT USE

Previously, database connections were hardcoded in:
- `.env` files with fixed credentials
- Backend config files with static connection strings
- Environment variables set at deployment time

**Problems with static approach:**
- Adding a new database requires code changes and redeployment
- Credentials are scattered across config files
- No user control over database connections
- Cannot connect to new databases without developer intervention

### ✅ The NEW Way (Dynamic Credential Input)

**The frontend now allows users to dynamically input database credentials:**

1. **User inputs credentials** via a form in the frontend UI
2. **Backend tests the connection** before saving
3. **Credentials are stored securely** in Supabase (not in `.env` or code)
4. **Connection pools are created dynamically** at runtime
5. **Users can add/remove/toggle databases** without any code changes

### 🔄 Migration Checklist: Static → Dynamic

For your frontend, ensure you:

| Task | Status |
|------|--------|
| ❌ Remove hardcoded database configs from frontend | Required |
| ❌ Remove static connection strings | Required |
| ✅ Create Database Connection Form UI | Required |
| ✅ Implement "Test Connection" before saving | Required |
| ✅ Create Database Management List/Table | Required |
| ✅ Add activate/deactivate toggle per database | Required |
| ✅ Call `/api/databases/refresh-pools` after changes | Required |
| ✅ Display connection status indicators | Recommended |
| ✅ Handle multiple database results in patient search | Required |

### 💡 Key Principle

> **"No database credentials should exist in frontend code, backend code, or `.env` files for external databases. All credentials are input by users through the UI and stored in Supabase."**

This means:
- **Backend `.env`** only contains Supabase connection (the config database)
- **All MySQL/PostgreSQL/other database credentials** come from user input
- **Frontend** provides forms for users to enter and manage credentials
- **Backend** receives credentials via API, tests them, stores in Supabase, creates pools

---

## 🔴 CRITICAL: Supabase Table Updates Required

### Current Table Structure
Based on your current `module3.db_informations` table:

| Column | Type | Status |
|--------|------|--------|
| id | int8 | ✅ OK |
| created_at | timestamptz | ✅ OK |
| host | varchar | ✅ OK |
| port | varchar | ✅ OK (recommend int4) |
| user | varchar | ✅ OK |
| password | varchar | ✅ OK |
| db_name | varchar | ✅ OK |
| description | varchar | ✅ OK |
| facility_code | varchar | ✅ OK |
| status | bool | ✅ OK |
| system_type | varchar | ⚠️ Add constraint |

### 🔧 Required Changes to Supabase Table

Run these SQL commands in Supabase SQL Editor:

```sql
-- =====================================================
-- 1. Add db_type column (REQUIRED for multi-database support)
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS db_type VARCHAR(20) DEFAULT 'mysql';

-- Add comment for documentation
COMMENT ON COLUMN module3.db_informations.db_type IS 
'Database type: mysql, postgresql, mariadb, mssql';

-- =====================================================
-- 2. Add updated_at column for tracking changes
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION module3.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_db_informations_updated_at
    BEFORE UPDATE ON module3.db_informations
    FOR EACH ROW
    EXECUTE FUNCTION module3.update_updated_at_column();

-- =====================================================
-- 3. Add SSL option for secure connections
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false;

-- =====================================================
-- 4. Add connection_timeout for better control
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS connection_timeout INT DEFAULT 10000;

-- =====================================================
-- 5. Add region/location for geographic organization
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- =====================================================
-- 6. Add last_connected_at for monitoring
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ;

-- =====================================================
-- 7. Add connection_status for health tracking
-- =====================================================
ALTER TABLE module3.db_informations 
ADD COLUMN IF NOT EXISTS connection_status VARCHAR(20) DEFAULT 'unknown';

COMMENT ON COLUMN module3.db_informations.connection_status IS 
'Last known status: connected, failed, unknown';

-- =====================================================
-- 8. Create enum constraint for system_type (iHOMIS/iClinic only)
-- =====================================================
-- Note: Since column exists, we add a check constraint
ALTER TABLE module3.db_informations 
ADD CONSTRAINT check_system_type 
CHECK (system_type IN ('ihomis', 'iclinic', 'IHOMIS', 'ICLINIC', 'iHOMIS', 'iClinic'));

-- =====================================================
-- 9. Create enum constraint for db_type
-- =====================================================
ALTER TABLE module3.db_informations 
ADD CONSTRAINT check_db_type 
CHECK (db_type IN ('mysql', 'postgresql', 'mariadb', 'mssql'));

-- =====================================================
-- 10. Add unique constraint for host+port+db_name
-- =====================================================
ALTER TABLE module3.db_informations 
ADD CONSTRAINT unique_database_connection 
UNIQUE (host, port, db_name);

-- =====================================================
-- 11. Update existing rows to have db_type = 'mysql'
-- =====================================================
UPDATE module3.db_informations 
SET db_type = 'mysql' 
WHERE db_type IS NULL;

-- =====================================================
-- 12. Verify the changes
-- =====================================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'module3' 
AND table_name = 'db_informations'
ORDER BY ordinal_position;
```

### Updated Table Structure (After Changes)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | int8 | serial | Primary key |
| `created_at` | timestamptz | NOW() | Creation timestamp |
| `updated_at` | timestamptz | NOW() | Last update timestamp |
| `host` | varchar | - | Database server hostname/IP |
| `port` | varchar | - | Database port |
| `user` | varchar | - | Database username |
| `password` | varchar | - | Database password |
| `db_name` | varchar | - | Database name |
| `db_type` | varchar(20) | 'mysql' | **NEW**: mysql, postgresql, mariadb, mssql |
| `description` | varchar | - | Human-readable description |
| `facility_code` | varchar | - | Hospital/facility code |
| `system_type` | varchar | - | **CONSTRAINED**: ihomis OR iclinic only |
| `status` | bool | false | Active/inactive toggle |
| `ssl_enabled` | bool | false | **NEW**: Enable SSL connection |
| `connection_timeout` | int | 10000 | **NEW**: Connection timeout in ms |
| `region` | varchar(100) | - | **NEW**: Geographic region |
| `last_connected_at` | timestamptz | - | **NEW**: Last successful connection |
| `connection_status` | varchar(20) | 'unknown' | **NEW**: connected, failed, unknown |

---

## 🔌 Backend API Endpoints

### Database Management Endpoints (NEW)

These endpoints will be created on the backend to manage database connections:

#### 1. **List All Databases**
```
GET /api/databases
```
**Response:**
```json
{
  "success": true,
  "databases": [
    {
      "id": 1,
      "host": "180.232.187.222",
      "port": "3306",
      "db_name": "adnph_ihomis_plus",
      "db_type": "mysql",
      "description": "AGUSAN DEL NORTE PROVINCIAL HOSPITAL",
      "facility_code": "0005027",
      "system_type": "ihomis",
      "status": true,
      "ssl_enabled": false,
      "connection_status": "connected",
      "last_connected_at": "2026-02-25T03:09:48.806Z"
    }
  ],
  "total": 1
}
```

#### 2. **Add New Database** (Frontend Form Submission)
```
POST /api/databases
```
**Request Body:**
```json
{
  "host": "192.168.1.100",
  "port": "3306",
  "user": "db_user",
  "password": "db_password",
  "db_name": "hospital_db",
  "db_type": "mysql",
  "description": "City General Hospital",
  "facility_code": "CGH001",
  "system_type": "ihomis",
  "ssl_enabled": false,
  "region": "Region X"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Database added successfully",
  "database": {
    "id": 2,
    "host": "192.168.1.100",
    "port": "3306",
    "db_name": "hospital_db",
    "status": false,
    "connection_status": "unknown"
  }
}
```

#### 3. **Test Database Connection** (Before Saving)
```
POST /api/databases/test-connection
```
**Request Body:**
```json
{
  "host": "192.168.1.100",
  "port": "3306",
  "user": "db_user",
  "password": "db_password",
  "db_name": "hospital_db",
  "db_type": "mysql",
  "ssl_enabled": false
}
```
**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "server_version": "8.4.8",
    "connection_time": "45ms",
    "current_database": "hospital_db",
    "table_count": 250
  }
}
```
**Response (Failure):**
```json
{
  "success": false,
  "message": "Connection failed",
  "error": "Access denied for user 'db_user'@'192.168.1.100'",
  "error_code": "ER_ACCESS_DENIED_ERROR"
}
```

#### 4. **Update Database**
```
PUT /api/databases/:id
```
**Request Body:**
```json
{
  "description": "Updated Hospital Name",
  "status": true
}
```

#### 5. **Delete Database**
```
DELETE /api/databases/:id
```

#### 6. **Toggle Database Status**
```
PATCH /api/databases/:id/toggle
```
**Response:**
```json
{
  "success": true,
  "message": "Database status toggled",
  "new_status": true
}
```

#### 7. **Refresh Connection Pools** (After Adding/Removing Databases)
```
POST /api/databases/refresh-pools
```
**Response:**
```json
{
  "success": true,
  "message": "Connection pools refreshed",
  "active_pools": 3,
  "databases": ["adnph_ihomis_plus", "hospital_db", "clinic_db"]
}
```

---

## 🖥️ Frontend Implementation Guide

### 1. Database Connection Form

Create a form component for adding new database connections:

```jsx
// React Example: DatabaseConnectionForm.jsx
import React, { useState } from 'react';

const DB_TYPES = [
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mariadb', label: 'MariaDB', defaultPort: 3306 },
  { value: 'mssql', label: 'SQL Server', defaultPort: 1433 },
];

const SYSTEM_TYPES = [
  { value: 'ihomis', label: 'iHOMIS' },
  { value: 'iclinic', label: 'iClinic' },
];

export function DatabaseConnectionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
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
    region: '',
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleDbTypeChange = (e) => {
    const dbType = e.target.value;
    const defaultPort = DB_TYPES.find(t => t.value === dbType)?.defaultPort || 3306;
    setFormData({ ...formData, db_type: dbType, port: String(defaultPort) });
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/databases/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formData.host,
          port: formData.port,
          user: formData.user,
          password: formData.password,
          db_name: formData.db_name,
          db_type: formData.db_type,
          ssl_enabled: formData.ssl_enabled,
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Test connection first if not already tested
    if (!testResult?.success) {
      alert('Please test the connection first');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh connection pools
        await fetch('/api/databases/refresh-pools', { method: 'POST' });
        onSuccess?.(result.database);
      } else {
        alert(`Failed to add database: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="database-form">
      <h2>Add Database Connection</h2>
      
      {/* Database Type Selection */}
      <div className="form-group">
        <label>Database Type *</label>
        <select 
          value={formData.db_type} 
          onChange={handleDbTypeChange}
          required
        >
          {DB_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* System Type Selection */}
      <div className="form-group">
        <label>System Type *</label>
        <select 
          value={formData.system_type} 
          onChange={(e) => setFormData({ ...formData, system_type: e.target.value })}
          required
        >
          {SYSTEM_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Connection Details */}
      <div className="form-row">
        <div className="form-group">
          <label>Host / IP Address *</label>
          <input
            type="text"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            placeholder="192.168.1.100 or hostname"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Port *</label>
          <input
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
            placeholder="3306"
            required
          />
        </div>
      </div>

      {/* Credentials */}
      <div className="form-row">
        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            value={formData.user}
            onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            placeholder="Database username"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Database password"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Database Name *</label>
        <input
          type="text"
          value={formData.db_name}
          onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
          placeholder="hospital_db"
          required
        />
      </div>

      {/* Optional Fields */}
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="City General Hospital Database"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Facility Code</label>
          <input
            type="text"
            value={formData.facility_code}
            onChange={(e) => setFormData({ ...formData, facility_code: e.target.value })}
            placeholder="CGH001"
          />
        </div>
        
        <div className="form-group">
          <label>Region</label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="Region X"
          />
        </div>
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.ssl_enabled}
            onChange={(e) => setFormData({ ...formData, ssl_enabled: e.target.checked })}
          />
          Enable SSL Connection
        </label>
      </div>

      {/* Test Connection Button */}
      <div className="form-actions">
        <button 
          type="button" 
          onClick={testConnection}
          disabled={testing || !formData.host || !formData.user || !formData.db_name}
          className="btn-test"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Test Result Display */}
      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.success ? (
            <>
              <span className="icon">✅</span>
              <div>
                <strong>Connection Successful!</strong>
                <p>Server: {testResult.details?.server_version}</p>
                <p>Tables: {testResult.details?.table_count}</p>
                <p>Latency: {testResult.details?.connection_time}</p>
              </div>
            </>
          ) : (
            <>
              <span className="icon">❌</span>
              <div>
                <strong>Connection Failed</strong>
                <p>{testResult.error}</p>
                {testResult.error_code && <p>Code: {testResult.error_code}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={saving || !testResult?.success}
        className="btn-submit"
      >
        {saving ? 'Adding Database...' : 'Add Database'}
      </button>
    </form>
  );
}
```

### 2. Database Management List

```jsx
// React Example: DatabaseList.jsx
import React, { useState, useEffect } from 'react';

export function DatabaseList() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/databases');
      const data = await response.json();
      setDatabases(data.databases || []);
    } catch (error) {
      console.error('Failed to fetch databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await fetch(`/api/databases/${id}/toggle`, { method: 'PATCH' });
      await fetch('/api/databases/refresh-pools', { method: 'POST' });
      fetchDatabases();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteDatabase = async (id) => {
    if (!confirm('Are you sure you want to delete this database connection?')) return;
    
    try {
      await fetch(`/api/databases/${id}`, { method: 'DELETE' });
      await fetch('/api/databases/refresh-pools', { method: 'POST' });
      fetchDatabases();
    } catch (error) {
      console.error('Failed to delete database:', error);
    }
  };

  const getSystemTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'ihomis': return '🏥';
      case 'iclinic': return '🩺';
      default: return '📊';
    }
  };

  const getDbTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'mysql': return '🐬';
      case 'postgresql': return '🐘';
      case 'mariadb': return '🦭';
      case 'mssql': return '📦';
      default: return '💾';
    }
  };

  if (loading) return <div>Loading databases...</div>;

  return (
    <div className="database-list">
      <h2>Connected Databases</h2>
      
      <table>
        <thead>
          <tr>
            <th>Database</th>
            <th>Type</th>
            <th>System</th>
            <th>Host</th>
            <th>Facility</th>
            <th>Status</th>
            <th>Connection</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {databases.map(db => (
            <tr key={db.id}>
              <td>
                <strong>{db.db_name}</strong>
                {db.description && <small>{db.description}</small>}
              </td>
              <td>
                {getDbTypeIcon(db.db_type)} {db.db_type}
              </td>
              <td>
                {getSystemTypeIcon(db.system_type)} {db.system_type}
              </td>
              <td>{db.host}:{db.port}</td>
              <td>{db.facility_code || '-'}</td>
              <td>
                <button 
                  onClick={() => toggleStatus(db.id)}
                  className={`status-btn ${db.status ? 'active' : 'inactive'}`}
                >
                  {db.status ? '✅ Active' : '⏸️ Inactive'}
                </button>
              </td>
              <td>
                <span className={`connection-status ${db.connection_status}`}>
                  {db.connection_status === 'connected' ? '🟢' : 
                   db.connection_status === 'failed' ? '🔴' : '🟡'}
                  {db.connection_status}
                </span>
              </td>
              <td>
                <button onClick={() => deleteDatabase(db.id)} className="btn-delete">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {databases.length === 0 && (
        <p className="empty-state">No databases configured. Add one to get started.</p>
      )}
    </div>
  );
}
```

### 3. System Type Selector for Patient Operations

When performing patient operations, users can select which system type to query:

```jsx
// React Example: PatientSearch.jsx
import React, { useState } from 'react';

export function PatientSearch() {
  const [searchName, setSearchName] = useState('');
  const [systemType, setSystemType] = useState('all'); // all, ihomis, iclinic
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPatients = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        name: searchName,
        limit: 50,
      });
      
      if (systemType !== 'all') {
        params.append('system_type', systemType);
      }
      
      const response = await fetch(`/api/patients/search?${params}`);
      const data = await response.json();
      setResults(data.databases || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-search">
      <div className="search-form">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search patient name..."
        />
        
        <select value={systemType} onChange={(e) => setSystemType(e.target.value)}>
          <option value="all">All Systems</option>
          <option value="ihomis">iHOMIS Only</option>
          <option value="iclinic">iClinic Only</option>
        </select>
        
        <button onClick={searchPatients} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {/* Results grouped by database */}
      {results.map(db => (
        <div key={db.name} className="database-results">
          <h3>{db.name} ({db.count} results)</h3>
          <ul>
            {db.data.map(patient => (
              <li key={patient.hpercode}>
                {patient.last_name}, {patient.first_name} - {patient.hpercode}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 System Type Differences

### iHOMIS vs iClinic Table Mappings

The backend handles different table structures based on `system_type`:

| Operation | iHOMIS Tables | iClinic Tables |
|-----------|---------------|----------------|
| Patient Info | `hperson` | `tbl_patient` |
| Admissions | `hadmlog` | `tbl_admission` |
| Patient Room | `hpatroom` | `tbl_patient_room` |
| Facilities | `fhud_hospital` | `tbl_facility` |
| Address | `haddr` | `tbl_address` |
| Barangay | `hbrgy` | `tbl_barangay` |
| City | `hcity` | `tbl_city` |
| Province | `hprov` | `tbl_province` |

### iHOMIS Patient Field Mapping
```javascript
{
  hpercode: 'Patient ID',
  patlast: 'Last Name',
  patfirst: 'First Name',
  patmiddle: 'Middle Name',
  patsuffix: 'Suffix',
  patsex: 'Sex (M/F)',
  patbdate: 'Birth Date',
  hfhudcode: 'Facility Code'
}
```

### iClinic Patient Field Mapping
```javascript
{
  patient_id: 'Patient ID',
  lastname: 'Last Name',
  firstname: 'First Name',
  middlename: 'Middle Name',
  suffix: 'Suffix',
  gender: 'Gender',
  birthdate: 'Birth Date',
  facility_id: 'Facility ID'
}
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vue)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐     ┌──────────────────┐                    │
│   │ Database Manager │     │  Patient Search  │                    │
│   │   - Add Form     │     │   - System Type  │                    │
│   │   - List View    │     │   - Multi-DB     │                    │
│   │   - Test Connect │     │   - Aggregated   │                    │
│   └────────┬─────────┘     └────────┬─────────┘                    │
│            │                        │                               │
└────────────┼────────────────────────┼───────────────────────────────┘
             │                        │
             ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND API (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────┐    ┌──────────────────────────┐     │
│   │ /api/databases          │    │ /api/patients            │     │
│   │  POST   - Add DB        │    │  GET /search - Multi-DB  │     │
│   │  GET    - List DBs      │    │  GET /:id   - By ID      │     │
│   │  DELETE - Remove DB     │    │  Adapts to system_type   │     │
│   │  POST /test-connection  │    │  (ihomis/iclinic)        │     │
│   │  POST /refresh-pools    │    │                          │     │
│   └───────────┬─────────────┘    └─────────────┬────────────┘     │
│               │                                │                   │
│               ▼                                ▼                   │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │              Dynamic Connection Pool Manager            │     │
│   │                                                         │     │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│   │  │  MySQL   │  │PostgreSQL│  │ MariaDB  │  ...        │     │
│   │  │  Driver  │  │  Driver  │  │  Driver  │             │     │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │     │
│   │       │             │             │                    │     │
│   └───────┼─────────────┼─────────────┼────────────────────┘     │
│           │             │             │                           │
└───────────┼─────────────┼─────────────┼───────────────────────────┘
            │             │             │
            ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (Config Store)                       │
├─────────────────────────────────────────────────────────────────────┤
│   module3.db_informations                                           │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ id | host | port | user | password | db_name | db_type     │  │
│   │    | description | facility_code | system_type | status    │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │             │             │
            ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATABASES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │
│  │ Hospital A    │ │ Hospital B    │ │ Clinic C      │            │
│  │ MySQL/iHOMIS  │ │ MySQL/iHOMIS  │ │ MySQL/iClinic │            │
│  └───────────────┘ └───────────────┘ └───────────────┘            │
│                                                                     │
│  ┌───────────────┐ ┌───────────────┐                               │
│  │ Hospital D    │ │ Regional DB   │                               │
│  │PostgreSQL/... │ │ MariaDB/...   │                               │
│  └───────────────┘ └───────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist for Frontend

### Phase 1: Database Management UI
- [ ] Create database connection form component
- [ ] Implement connection test functionality
- [ ] Create database list/management view
- [ ] Add toggle active/inactive functionality
- [ ] Add delete database functionality

### Phase 2: System Type Support
- [ ] Add system type selector (iHOMIS/iClinic)
- [ ] Create system-type-specific patient search forms
- [ ] Handle different field mappings in results display
- [ ] Display system type badges/icons

### Phase 3: Multi-Database Operations
- [ ] Aggregate search results from multiple databases
- [ ] Display results grouped by database/facility
- [ ] Implement database-specific patient tagging
- [ ] Implement cross-database patient profiling

### Phase 4: Monitoring & Health
- [ ] Create connection health dashboard
- [ ] Display real-time connection status
- [ ] Implement auto-refresh for connection status
- [ ] Add notification for connection failures

---

## 🔐 Security Considerations

1. **Frontend Security:**
   - Never store database passwords in localStorage/sessionStorage
   - Use HTTPS for all API calls
   - Implement proper authentication before allowing database management

2. **Backend Security:**
   - Validate all input before database operations
   - Sanitize connection strings
   - Use parameterized queries
   - Implement rate limiting on connection tests
   - Log all database management operations

3. **Supabase RLS:**
   ```sql
   -- Enable RLS on db_informations
   ALTER TABLE module3.db_informations ENABLE ROW LEVEL SECURITY;
   
   -- Policy: Only authenticated admins can manage databases
   CREATE POLICY "Admin only access" ON module3.db_informations
     FOR ALL USING (auth.role() = 'admin');
   ```

---

## 📁 Files to Create/Modify in Backend

The backend needs these additions:

| File | Action | Description |
|------|--------|-------------|
| `routes/databases.js` | **CREATE** | CRUD endpoints for database management |
| `config/multiDbPools.js` | **CREATE** | Multi-database type pool manager |
| `services/dbConnectionTester.js` | **CREATE** | Connection testing service |
| `middleware/adminAuth.js` | **CREATE** | Admin authentication middleware |
| `config/mysqlPools.js` | **MODIFY** | Add support for multiple DB types |
| `config/supabaseDbInfo.js` | **MODIFY** | Fetch db_type, ssl_enabled fields |
| `routes/patients.js` | **MODIFY** | Add system_type filtering |
| `routes/index.js` | **MODIFY** | Add database routes |

---

## 🚀 Quick Start

1. **Update Supabase Table** - Run the SQL commands in the first section
2. **Update Backend** - Apply the backend changes (see separate PR)
3. **Create Frontend Components** - Use the React examples above
4. **Test Flow**:
   - Add a database via form
   - Test connection
   - Enable database (set status = true)
   - Refresh pools
   - Query patients

---

## � Static vs Dynamic: Code Examples

### ❌ WRONG: Static/Hardcoded Database Connection (DON'T DO THIS)

```javascript
// ❌ BAD: Hardcoded in frontend config
const DATABASE_CONFIG = {
  host: '192.168.1.100',
  port: 3306,
  user: 'root',
  password: 'hardcoded_password', // ❌ NEVER DO THIS
  database: 'hospital_db'
};

// ❌ BAD: Reading from .env in frontend
const dbHost = process.env.REACT_APP_DB_HOST;
const dbPassword = process.env.REACT_APP_DB_PASSWORD;

// ❌ BAD: Static database list
const DATABASES = [
  { name: 'Hospital A', host: '10.0.0.1' },
  { name: 'Hospital B', host: '10.0.0.2' },
];
```

### ✅ CORRECT: Dynamic Credential Input from Frontend

```javascript
// ✅ GOOD: User inputs credentials via form
const [credentials, setCredentials] = useState({
  host: '',
  port: '',
  user: '',
  password: '',
  db_name: '',
  db_type: 'mysql',
  system_type: 'ihomis'
});

// ✅ GOOD: Test connection with user-provided credentials
const testConnection = async () => {
  const response = await fetch('/api/databases/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials) // Credentials from form input
  });
  return response.json();
};

// ✅ GOOD: Save credentials to backend (stored in Supabase)
const saveDatabase = async () => {
  const response = await fetch('/api/databases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (response.ok) {
    // Refresh pools to include new database
    await fetch('/api/databases/refresh-pools', { method: 'POST' });
  }
};

// ✅ GOOD: Fetch database list from API (not hardcoded)
const [databases, setDatabases] = useState([]);

useEffect(() => {
  fetch('/api/databases')
    .then(res => res.json())
    .then(data => setDatabases(data.databases));
}, []);
```

---

## 🎯 Complete User Flow: Adding a New Database

### Step-by-Step Frontend Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ADDS NEW DATABASE                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Open Database Management Page                         │
│  └── Navigate to: /settings/databases or /admin/databases      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Click "Add New Database" Button                       │
│  └── Opens modal/form for credential input                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Fill in Database Credentials                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Database Type:    [MySQL ▼]                             │   │
│  │ System Type:      [iHOMIS ▼]                            │   │
│  │ Host/IP:          [192.168.1.100        ]               │   │
│  │ Port:             [3306                 ]               │   │
│  │ Username:         [hospital_user        ]               │   │
│  │ Password:         [••••••••••           ]               │   │
│  │ Database Name:    [hospital_ihomis      ]               │   │
│  │ Description:      [City General Hospital]               │   │
│  │ Facility Code:    [CGH001               ]               │   │
│  │ Region:           [Region X             ]               │   │
│  │ ☐ Enable SSL                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Click "Test Connection" Button                        │
│  └── POST /api/databases/test-connection                       │
│      └── Backend tests connection WITHOUT saving               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│  ❌ Connection Failed │         │  ✅ Connection Success│
│  └── Show error msg   │         │  └── Show db info    │
│  └── Fix credentials  │         │  └── Enable Save btn │
└──────────────────────┘         └──────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Click "Save Database" Button                          │
│  └── POST /api/databases                                       │
│      └── Backend saves to Supabase db_informations table       │
│      └── Returns new database ID                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Toggle "Active" Status (if not auto-activated)        │
│  └── PATCH /api/databases/:id/toggle                           │
│      └── Sets status = true                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Refresh Connection Pools                              │
│  └── POST /api/databases/refresh-pools                         │
│      └── Backend reloads all active databases                  │
│      └── Creates new connection pool for added database        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: Database Ready for Use!                               │
│  └── Patient search now includes new database                  │
│  └── All patient operations work on new database               │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend React Implementation for Complete Flow

```jsx
// DatabaseManagement.jsx - Complete implementation

import React, { useState, useEffect } from 'react';

// API base URL - adjust for your setup
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function DatabaseManagement() {
  const [databases, setDatabases] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch databases on mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/databases`);
      const data = await response.json();
      setDatabases(data.databases || []);
    } catch (error) {
      console.error('Failed to fetch databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPools = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API_BASE}/api/databases/refresh-pools`, { method: 'POST' });
      await fetchDatabases();
    } catch (error) {
      console.error('Failed to refresh pools:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDatabaseAdded = async () => {
    setShowAddForm(false);
    await refreshPools();
  };

  return (
    <div className="database-management">
      <header>
        <h1>Database Connections</h1>
        <div className="actions">
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            + Add Database
          </button>
          <button onClick={refreshPools} disabled={refreshing} className="btn-secondary">
            {refreshing ? 'Refreshing...' : '🔄 Refresh Pools'}
          </button>
        </div>
      </header>

      {/* Database List */}
      <DatabaseList 
        databases={databases} 
        onUpdate={fetchDatabases}
        onRefreshPools={refreshPools}
      />

      {/* Add Database Modal */}
      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)}>
          <AddDatabaseForm onSuccess={handleDatabaseAdded} />
        </Modal>
      )}
    </div>
  );
}

// Add Database Form Component
function AddDatabaseForm({ onSuccess }) {
  const [formData, setFormData] = useState({
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
    region: '',
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Update port when db_type changes
  const handleDbTypeChange = (e) => {
    const dbType = e.target.value;
    const defaultPorts = { mysql: '3306', postgresql: '5432', mariadb: '3306', mssql: '1433' };
    setFormData({ 
      ...formData, 
      db_type: dbType, 
      port: defaultPorts[dbType] || '3306' 
    });
    setTestResult(null); // Reset test result when config changes
  };

  // Test connection - REQUIRED before saving
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/databases/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formData.host,
          port: formData.port,
          user: formData.user,
          password: formData.password,
          db_name: formData.db_name,
          db_type: formData.db_type,
          ssl_enabled: formData.ssl_enabled,
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      // Auto-detect system type if available
      if (result.success && result.details?.detected_system) {
        setFormData(prev => ({ 
          ...prev, 
          system_type: result.details.detected_system 
        }));
      }
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  // Save database - Only after successful test
  const saveDatabase = async (e) => {
    e.preventDefault();
    
    if (!testResult?.success) {
      alert('Please test the connection successfully before saving');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Automatically activate the database
        await fetch(`${API_BASE}/api/databases/${result.database.id}/toggle`, {
          method: 'PATCH',
        });
        
        onSuccess?.();
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveDatabase} className="add-database-form">
      <h2>Add New Database Connection</h2>
      
      <p className="form-description">
        Enter the credentials for the database you want to connect. 
        You must test the connection before saving.
      </p>

      {/* Database Type */}
      <div className="form-row">
        <div className="form-group">
          <label>Database Type *</label>
          <select value={formData.db_type} onChange={handleDbTypeChange}>
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mssql">SQL Server</option>
          </select>
        </div>

        <div className="form-group">
          <label>System Type *</label>
          <select 
            value={formData.system_type} 
            onChange={(e) => setFormData({ ...formData, system_type: e.target.value })}
          >
            <option value="ihomis">iHOMIS</option>
            <option value="iclinic">iClinic</option>
          </select>
        </div>
      </div>

      {/* Connection Details */}
      <div className="form-row">
        <div className="form-group flex-2">
          <label>Host / IP Address *</label>
          <input
            type="text"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            placeholder="192.168.1.100 or db.example.com"
            required
          />
        </div>
        <div className="form-group flex-1">
          <label>Port *</label>
          <input
            type="text"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Credentials */}
      <div className="form-row">
        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            value={formData.user}
            onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            placeholder="Database username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Database password"
            required
          />
        </div>
      </div>

      {/* Database Name */}
      <div className="form-group">
        <label>Database Name *</label>
        <input
          type="text"
          value={formData.db_name}
          onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
          placeholder="hospital_ihomis"
          required
        />
      </div>

      {/* Description & Facility */}
      <div className="form-row">
        <div className="form-group flex-2">
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="City General Hospital"
          />
        </div>
        <div className="form-group flex-1">
          <label>Facility Code</label>
          <input
            type="text"
            value={formData.facility_code}
            onChange={(e) => setFormData({ ...formData, facility_code: e.target.value })}
            placeholder="CGH001"
          />
        </div>
      </div>

      {/* SSL Option */}
      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.ssl_enabled}
            onChange={(e) => setFormData({ ...formData, ssl_enabled: e.target.checked })}
          />
          Enable SSL Connection
        </label>
      </div>

      {/* Test Button - MUST test before save */}
      <div className="form-actions">
        <button 
          type="button" 
          onClick={testConnection}
          disabled={testing || !formData.host || !formData.user || !formData.password || !formData.db_name}
          className="btn-test"
        >
          {testing ? '⏳ Testing Connection...' : '🔌 Test Connection'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.success ? (
            <div className="result-content">
              <span className="icon">✅</span>
              <div>
                <strong>Connection Successful!</strong>
                <ul>
                  <li>Server: {testResult.details?.server_version}</li>
                  <li>Tables: {testResult.details?.table_count}</li>
                  <li>Latency: {testResult.details?.connection_time}</li>
                  {testResult.details?.detected_system && (
                    <li>Detected System: {testResult.details.detected_system.toUpperCase()}</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="result-content">
              <span className="icon">❌</span>
              <div>
                <strong>Connection Failed</strong>
                <p>{testResult.error || testResult.message}</p>
                {testResult.error_code && <p className="error-code">Code: {testResult.error_code}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button - Only enabled after successful test */}
      <div className="form-submit">
        <button 
          type="submit" 
          disabled={saving || !testResult?.success}
          className="btn-primary btn-save"
        >
          {saving ? '💾 Saving...' : '💾 Save Database'}
        </button>
        
        {!testResult?.success && (
          <p className="hint">Test the connection before saving</p>
        )}
      </div>
    </form>
  );
}

// CSS Styles (can be in separate file)
const styles = `
.add-database-form {
  max-width: 600px;
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.form-group.flex-2 { flex: 2; }
.form-group.flex-1 { flex: 1; }

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-test {
  background: #4a90d9;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-result {
  padding: 15px;
  border-radius: 4px;
  margin: 15px 0;
}

.test-result.success {
  background: #d4edda;
  border: 1px solid #28a745;
}

.test-result.error {
  background: #f8d7da;
  border: 1px solid #dc3545;
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.result-content .icon {
  font-size: 24px;
}

.btn-save {
  background: #28a745;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.hint {
  text-align: center;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}
`;
```

---

## 📋 Frontend Files Checklist

Create these files in your frontend project:

| File | Purpose |
|------|---------|
| `pages/DatabaseManagement.jsx` | Main database management page |
| `components/AddDatabaseForm.jsx` | Form for inputting credentials |
| `components/DatabaseList.jsx` | List/table of databases |
| `components/DatabaseCard.jsx` | Individual database display |
| `components/ConnectionStatus.jsx` | Real-time status indicator |
| `services/databaseApi.js` | API calls for database operations |
| `hooks/useDatabases.js` | React hook for database state |
| `styles/database-management.css` | Styling for database UI |

---

## �📚 Related Documentation

- [DYNAMIC_DATABASE_VERIFICATION.md](./DYNAMIC_DATABASE_VERIFICATION.md) - Connection verification guide
- [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md) - Current verification status
- [postman/UHC-Backend-API.postman_collection.json](./postman/UHC-Backend-API.postman_collection.json) - API testing collection
