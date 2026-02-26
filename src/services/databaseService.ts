/**
 * Database Service - API calls for managing dynamic database connections
 * 
 * This service handles all CRUD operations for database connections including:
 * - Listing all databases
 * - Adding new databases with credential input
 * - Testing connections before saving
 * - Toggling database status (active/inactive)
 * - Deleting databases
 * - Refreshing connection pools
 */

// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Database types supported
export type DatabaseType = 'mysql' | 'postgresql' | 'mariadb' | 'mssql';

// System types - iHOMIS and iClinic only
export type SystemType = 'ihomis' | 'iclinic';

// Connection status
export type ConnectionStatus = 'connected' | 'failed' | 'unknown';

// Database connection configuration
export interface DatabaseConnection {
  id?: number;
  host: string;
  port: string | number;
  user: string;
  password: string;
  db_name: string;
  db_type: DatabaseType;
  description: string;
  facility_code: string;
  system_type: SystemType;
  status: boolean;
  ssl_enabled?: boolean;
  connection_timeout?: number;
  region?: string;
  created_at?: string;
  updated_at?: string;
  last_connected_at?: string;
  connection_status?: ConnectionStatus;
}

// Form data for creating/updating database
export interface DatabaseFormData {
  host: string;
  port: string;
  user: string;
  password: string;
  db_name: string;
  db_type: DatabaseType;
  description: string;
  facility_code: string;
  system_type: SystemType;
  ssl_enabled: boolean;
  connection_timeout: number;
  region: string;
}

// Test connection request
export interface TestConnectionRequest {
  host: string;
  port: string | number;
  user: string;
  password: string;
  db_name: string;
  db_type: DatabaseType;
  ssl_enabled?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
}

export interface DatabaseListResponse {
  success: boolean;
  databases: DatabaseConnection[];
  total: number;
  message?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  connection_time?: number;
  server_info?: {
    version: string;
    database: string;
  };
  error?: string;
  error_code?: string;
}

export interface RefreshPoolsResponse {
  success: boolean;
  message: string;
  pools_count: number;
  databases: string[];
}

// Database type options with default ports
export const DB_TYPE_OPTIONS = [
  { value: 'mysql' as DatabaseType, label: 'MySQL', defaultPort: 3306 },
  { value: 'postgresql' as DatabaseType, label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mariadb' as DatabaseType, label: 'MariaDB', defaultPort: 3306 },
  { value: 'mssql' as DatabaseType, label: 'SQL Server', defaultPort: 1433 },
];

// System type options
export const SYSTEM_TYPE_OPTIONS = [
  { value: 'ihomis' as SystemType, label: 'iHOMIS' },
  { value: 'iclinic' as SystemType, label: 'iClinic' },
];

/**
 * Database Service Class
 */
class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/databases`;
  }

  /**
   * Get all database connections
   */
  async getAllDatabases(): Promise<DatabaseListResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching databases:', error);
      return {
        success: false,
        databases: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch databases',
      };
    }
  }

  /**
   * Test database connection without saving
   */
  async testConnection(credentials: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      return await response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        error: 'Network error or server unavailable',
      };
    }
  }

  /**
   * Add a new database connection
   */
  async addDatabase(database: DatabaseFormData): Promise<ApiResponse<DatabaseConnection>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(database),
      });

      return await response.json();
    } catch (error) {
      console.error('Error adding database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add database',
      };
    }
  }

  /**
   * Update an existing database connection
   */
  async updateDatabase(id: number, updates: Partial<DatabaseFormData>): Promise<ApiResponse<DatabaseConnection>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update database',
      };
    }
  }

  /**
   * Delete a database connection
   */
  async deleteDatabase(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete database',
      };
    }
  }

  /**
   * Toggle database active status
   */
  async toggleDatabaseStatus(id: number): Promise<ApiResponse<{ new_status: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error toggling database status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle database status',
      };
    }
  }

  /**
   * Refresh all connection pools
   * Call this after adding, removing, or toggling databases
   */
  async refreshPools(): Promise<RefreshPoolsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh-pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error refreshing pools:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh connection pools',
        pools_count: 0,
        databases: [],
      };
    }
  }

  /**
   * Get default port for a database type
   */
  getDefaultPort(dbType: DatabaseType): number {
    const option = DB_TYPE_OPTIONS.find(opt => opt.value === dbType);
    return option?.defaultPort || 3306;
  }

  /**
   * Get display label for database type
   */
  getDbTypeLabel(dbType: DatabaseType): string {
    const option = DB_TYPE_OPTIONS.find(opt => opt.value === dbType);
    return option?.label || dbType;
  }

  /**
   * Get display label for system type
   */
  getSystemTypeLabel(systemType: SystemType): string {
    const option = SYSTEM_TYPE_OPTIONS.find(opt => opt.value === systemType);
    return option?.label || systemType;
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
