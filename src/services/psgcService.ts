/**
 * PSGC Service - API calls for Philippine Standard Geographic Code
 * Source: https://psgc.gitlab.io/api/
 */

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

export interface PSGCEntity {
    code: string;
    name: string;
}

export interface PSGCRegion extends PSGCEntity {
    regionName: string;
}

export const psgcService = {
    /**
     * Get all regions
     */
    async getRegions(): Promise<PSGCRegion[]> {
        try {
            const response = await fetch(`${PSGC_BASE_URL}/regions/`);
            if (!response.ok) throw new Error('Failed to fetch regions');
            return await response.json();
        } catch (error) {
            console.error('PSGC Error (Regions):', error);
            return [];
        }
    },

    /**
     * Get provinces by region code
     */
    async getProvinces(regionCode: string): Promise<PSGCEntity[]> {
        try {
            const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/provinces/`);
            if (!response.ok) throw new Error('Failed to fetch provinces');
            return await response.json();
        } catch (error) {
            console.error('PSGC Error (Provinces):', error);
            return [];
        }
    },

    /**
     * Get cities/municipalities by province code
     */
    async getCities(provinceCode: string): Promise<PSGCEntity[]> {
        try {
            const response = await fetch(`${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities/`);
            if (!response.ok) throw new Error('Failed to fetch cities');
            return await response.json();
        } catch (error) {
            console.error('PSGC Error (Cities):', error);
            return [];
        }
    },

    /**
     * Get barangays by city/municipality code
     */
    async getBarangays(cityCode: string): Promise<PSGCEntity[]> {
        try {
            const response = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays/`);
            if (!response.ok) throw new Error('Failed to fetch barangays');
            return await response.json();
        } catch (error) {
            console.error('PSGC Error (Barangays):', error);
            return [];
        }
    },

    /**
     * Special case: Some cities are not under any province (Highly Urbanized Cities)
     * They might be directly under a region.
     */
    async getCitiesByRegion(regionCode: string): Promise<PSGCEntity[]> {
        try {
            const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`);
            if (!response.ok) throw new Error('Failed to fetch cities by region');
            return await response.json();
        } catch (error) {
            console.error('PSGC Error (Cities by Region):', error);
            return [];
        }
    }
};

export default psgcService;
