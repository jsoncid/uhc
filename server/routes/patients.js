import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/patients/search
 * @desc    Search patients by name (supports partial matching)
 * @query   name - Patient name to search
 *          facility - Facility code (required - filters by hfhudcode)
 *          limit - Max results (default: 50)
 */
router.get('/search', async (req, res) => {
  try {
    const { name, facility, limit = 50 } = req.query;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search name must be at least 2 characters',
      });
    }

    const searchTerm = `%${name.trim()}%`;
    const maxLimit = Math.min(parseInt(limit) || 50, 100);

    // Build query with JOIN to get barangay, city, province and region information
    let query = `
      SELECT 
        p.hpercode,
        p.patlast,
        p.patfirst,
        p.patmiddle,
        p.patsuffix,
        p.patsex,
        p.patbdate,
        p.hfhudcode,
        a.brg as brgycode,
        a.patstr,
        a.ctycode,
        a.provcode,
        a.patzip,
        b.bgycode,
        b.bgyname,
        c.ctyname,
        c.ctyreg,
        pv.provname,
        r.regname
      FROM hperson p
      LEFT JOIN haddr a ON p.hpercode = a.hpercode
      LEFT JOIN hbrgy b ON a.brg = b.bgycode
      LEFT JOIN hcity c ON a.ctycode = c.ctycode
      LEFT JOIN hprov pv ON a.provcode = pv.provcode
      LEFT JOIN hregion r ON c.ctyreg = r.regcode
      WHERE (p.patlast LIKE ? 
         OR p.patfirst LIKE ? 
         OR p.patmiddle LIKE ?
         OR p.hpercode LIKE ?)
    `;
    
    const params = [searchTerm, searchTerm, searchTerm, searchTerm];
    
    // Add facility filter if provided
    if (facility && facility.trim()) {
      query += ` AND p.hfhudcode = ?`;
      params.push(facility.trim());
    }
    
    query += ` ORDER BY p.patlast, p.patfirst LIMIT ?`;
    params.push(maxLimit);

    const [rows] = await pool.query(query, params);

    // Transform results to match frontend PatientProfile interface
    const patients = rows.map((row) => ({
      id: row.hpercode || '',
      hpercode: row.hpercode || '',
      first_name: row.patfirst || '',
      middle_name: row.patmiddle || '',
      last_name: row.patlast || '',
      ext_name: row.patsuffix || '',
      sex: mapSex(row.patsex),
      birth_date: formatDate(row.patbdate),
      facility_code: row.hfhudcode || '',
      created_at: '',
      brgy: row.bgycode || '',
      brgy_name: row.bgyname || '',
      street: row.patstr || '',
      city_code: row.ctycode || '',
      city_name: row.ctyname || '',
      province_code: row.provcode || '',
      province_name: row.provname || '',
      region_name: row.regname || '',
      zip_code: row.patzip || '',
    }));

    res.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/patients/:hpercode
 * @desc    Get single patient by hpercode
 */
router.get('/:hpercode', async (req, res) => {
  try {
    const { hpercode } = req.params;

    const query = `
      SELECT 
        p.hpercode,
        p.patlast,
        p.patfirst,
        p.patmiddle,
        p.patsuffix,
        p.patsex,
        p.patbdate,
        p.hfhudcode,
        a.brg as brgycode,
        a.patstr,
        a.ctycode,
        a.provcode,
        a.patzip,
        b.bgycode,
        b.bgyname,
        c.ctyname,
        c.ctyreg,
        pv.provname,
        r.regname
      FROM hperson p
      LEFT JOIN haddr a ON p.hpercode = a.hpercode
      LEFT JOIN hbrgy b ON a.brg = b.bgycode
      LEFT JOIN hcity c ON a.ctycode = c.ctycode
      LEFT JOIN hprov pv ON a.provcode = pv.provcode
      LEFT JOIN hregion r ON c.ctyreg = r.regcode
      WHERE p.hpercode = ?
    `;

    const [rows] = await pool.query(query, [hpercode]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const row = rows[0];
    const patient = {
      id: row.hpercode || '',
      hpercode: row.hpercode || '',
      first_name: row.patfirst || '',
      middle_name: row.patmiddle || '',
      last_name: row.patlast || '',
      ext_name: row.patsuffix || '',
      sex: mapSex(row.patsex),
      birth_date: formatDate(row.patbdate),
      facility_code: row.hfhudcode || '',
      created_at: '',
      brgy: row.bgycode || '',
      brgy_name: row.bgyname || '',
      street: row.patstr || '',
      city_code: row.ctycode || '',
      city_name: row.ctyname || '',
      province_code: row.provcode || '',
      province_name: row.provname || '',
      region_name: row.regname || '',
      zip_code: row.patzip || '',
    };

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/patients
 * @desc    Get all patients (paginated)
 * @query   page - Page number (default: 1)
 *          limit - Records per page (default: 20)
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        hpercode,
        patlast,
        patfirst,
        patmiddle,
        patsuffix,
        patsex,
        patbdate,
        hfhudcode
      FROM hperson
      ORDER BY patlast, patfirst
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [limit, offset]);
    
    // Get total count for pagination
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM hperson');
    const total = countResult[0].total;

    const patients = rows.map((row) => ({
      id: row.hpercode || '',
      hpercode: row.hpercode || '',
      first_name: row.patfirst || '',
      middle_name: row.patmiddle || '',
      last_name: row.patlast || '',
      ext_name: row.patsuffix || '',
      sex: mapSex(row.patsex),
      birth_date: formatDate(row.patbdate),
      facility_code: row.hfhudcode || '',
      created_at: '',
      brgy: '',
    }));

    res.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/patients/facilities/list
 * @desc    Get list of unique facilities from database
 */
router.get('/facilities/list', async (req, res) => {
  try {
    // Try to get facility names from hfacilit table if it exists
    // Otherwise fall back to hfhudcode from hperson
    let rows;
    
    try {
      // Try to get from hfacilit table (iHOMIS facility table)
      const [facilityRows] = await pool.query(`
        SELECT 
          hfhudcode as facility_code,
          facname as facility_name,
          factype as facility_type,
          (SELECT COUNT(*) FROM hperson WHERE hperson.hfhudcode = hfacilit.hfhudcode) as patient_count
        FROM hfacilit
        WHERE hfhudcode IS NOT NULL AND hfhudcode != ''
        ORDER BY facname
        LIMIT 100
      `);
      
      if (facilityRows.length > 0) {
        rows = facilityRows.map(f => ({
          facility_code: f.facility_code,
          facility_name: f.facility_name || f.facility_code,
          facility_type: f.facility_type || 'Health Facility',
          patient_count: f.patient_count || 0
        }));
      }
    } catch (e) {
      // hfacilit table doesn't exist, fall back
      console.log('hfacilit table not found, using hperson distinct values');
    }
    
    // Fallback: get distinct facility codes from hperson
    if (!rows || rows.length === 0) {
      const [distinctRows] = await pool.query(`
        SELECT DISTINCT 
          hfhudcode as facility_code,
          COUNT(*) as patient_count
        FROM hperson
        WHERE hfhudcode IS NOT NULL AND hfhudcode != ''
        GROUP BY hfhudcode
        ORDER BY patient_count DESC
        LIMIT 100
      `);
      
      rows = distinctRows.map(f => ({
        facility_code: f.facility_code,
        facility_name: f.facility_code, // Use code as name when no facility table
        facility_type: 'Health Facility',
        patient_count: f.patient_count || 0
      }));
    }

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get facilities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Helper function to map sex codes to standard values
function mapSex(sexCode) {
  if (!sexCode) return '';
  const code = String(sexCode).toUpperCase();
  if (code === 'M' || code === 'MALE' || code === '1') return 'male';
  if (code === 'F' || code === 'FEMALE' || code === '2') return 'female';
  return 'unknown';
}

// Helper function to format date
function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    // Return in YYYY-MM-DD format for input[type="date"]
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default router;
