import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://dasjhsvfipsadrykdojv.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_-paESA8FXhYxAcP0UrBNXA_ZSkRJm9s';

// In-memory fallback for serverless invocation
let mockCustomers = [
  {
    id: 101,
    full_name: 'Rahul Sargar',
    mobile_number: '7709647627',
    age: 26,
    gender: 'Male',
    address: 'Near Wadhegaon Naka',
    area_village: 'Sangola (413307)',
    medicine_name: 'Telmakind 40mg Tablet, Dolo 650',
    required_tablet: 'Telmakind 40mg Tablet, Dolo 650',
    medicine_strength: '40mg / 650mg',
    medicine_type: 'Tablet',
    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiology)',
    prescription_available: 'Yes',
    status: 'Active',
    notes: 'Regular customer prescription record - in-store patient file.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 102,
    full_name: 'Ananda Deshmukh',
    mobile_number: '9822014589',
    age: 58,
    gender: 'Male',
    address: 'Near S.T. Stand',
    area_village: 'Sangola Town',
    medicine_name: 'Telma 40mg, Ecosprin 75mg',
    required_tablet: 'Telma 40mg, Ecosprin 75mg',
    medicine_strength: '40mg / 75mg',
    medicine_type: 'Tablet',
    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiologist)',
    prescription_available: 'Yes',
    status: 'Verified',
    notes: 'Hypertension monthly medication record. Verified prescription on file.',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 103,
    full_name: 'Sunita Vijay Shinde',
    mobile_number: '9421039872',
    age: 42,
    gender: 'Female',
    address: 'Wadhegaon Road',
    area_village: 'Sangola - 413307',
    medicine_name: 'Pan-D (Pantoprazole + Domperidone)',
    required_tablet: 'Pan-D (Pantoprazole + Domperidone)',
    medicine_strength: '40mg + 30mg',
    medicine_type: 'Capsule',
    preferred_doctor: 'Dr. Patil Hospital Sangola',
    prescription_available: 'Yes',
    status: 'Verified',
    notes: 'Gastric medication record. In-store customer profile.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 104,
    full_name: 'Tanaji Baburao Mane',
    mobile_number: '9763254109',
    age: 64,
    gender: 'Male',
    address: 'Nazar Camp',
    area_village: 'Sangola Rural',
    medicine_name: 'Glycomet 500mg, Calpol 650mg',
    required_tablet: 'Glycomet 500mg, Calpol 650mg',
    medicine_strength: '500mg / 650mg',
    medicine_type: 'Tablet',
    preferred_doctor: 'Dr. Shinde (Diabetologist)',
    prescription_available: 'Yes',
    status: 'Under Review',
    notes: 'Diabetes health record. Diabetic profile registered.',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  }
];

function getSupabase() {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    return null;
  }
}

export async function handler(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = getSupabase();
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const isId = lastPart && !isNaN(Number(lastPart));

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const search = (params.search || '').toLowerCase();
      const status = params.status;

      let customers = [];
      let source = 'local';

      if (client) {
        try {
          let query = client.from('customers').select('*').order('created_at', { ascending: false });
          if (status && status !== 'All') {
            query = query.eq('status', status);
          }
          if (search) {
            query = query.or(`full_name.ilike.%${search}%,mobile_number.ilike.%${search}%,required_tablet.ilike.%${search}%,preferred_doctor.ilike.%${search}%,address.ilike.%${search}%`);
          }
          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            customers = data;
            source = 'supabase';
          } else {
            customers = [...mockCustomers];
          }
        } catch (e) {
          customers = [...mockCustomers];
        }
      } else {
        customers = [...mockCustomers];
      }

      if (source === 'local') {
        if (status && status !== 'All') {
          customers = customers.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
        }
        if (search) {
          customers = customers.filter(c =>
            (c.full_name || '').toLowerCase().includes(search) ||
            (c.mobile_number || '').toLowerCase().includes(search) ||
            (c.required_tablet || '').toLowerCase().includes(search) ||
            (c.preferred_doctor || '').toLowerCase().includes(search) ||
            (c.address || '').toLowerCase().includes(search)
          );
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, source, count: customers.length, customers })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        full_name,
        mobile_number,
        address,
        area_village,
        age,
        gender,
        preferred_doctor,
        medicines,
        medicine_name,
        required_tablet,
        medicine_strength,
        medicine_type,
        prescription_available,
        status,
        notes
      } = body;

      const medName = (medicine_name || required_tablet || '').trim();

      if (!full_name || !mobile_number || (!medName && (!Array.isArray(medicines) || medicines.length === 0))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Full Name, Mobile, and Medicine Requirement are required.' })
        };
      }

      const medsArray = Array.isArray(medicines) && medicines.length > 0
        ? medicines
        : (medName ? [{ name: medName, strength: medicine_strength || '', type: medicine_type || 'Tablet', quantity: '' }] : []);

      const effectiveMedName = medName || medsArray.map(m => m.name).join(', ');

      const newCustomer = {
        full_name: full_name.trim(),
        mobile_number: mobile_number.trim(),
        address: (address || 'Sangola').trim(),
        area_village: (area_village || 'Sangola (413307)').trim(),
        age: age ? parseInt(age, 10) || null : null,
        gender: (gender || 'Not Specified').trim(),
        preferred_doctor: (preferred_doctor || 'General Consultation / Self').trim(),
        medicines: medsArray,
        medicine_name: effectiveMedName,
        required_tablet: effectiveMedName,
        medicine_strength: (medicine_strength || medsArray.map(m => m.strength).filter(Boolean).join(', ') || '').trim(),
        medicine_type: (medicine_type || medsArray.map(m => m.type).filter(Boolean).join(', ') || 'Tablet').trim(),
        prescription_available: (prescription_available || 'Yes').trim(),
        status: status || 'Active',
        notes: (notes || '').trim(),
        created_at: new Date().toISOString()
      };

      let saved = null;
      let source = 'local';

      if (client) {
        try {
          const sbCustomer = { ...newCustomer };
          delete sbCustomer.medicines;
          const { data, error } = await client.from('customers').insert([sbCustomer]).select().single();
          if (!error && data) {
            saved = { ...data, medicines: newCustomer.medicines };
            source = 'supabase';
          }
        } catch (e) {
          // Clean fallback to local store
        }
      }

      if (!saved) {
        saved = { id: Date.now(), ...newCustomer };
        mockCustomers.unshift(saved);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, source, customer: saved, message: 'Customer registered successfully.' })
      };
    }

    if (event.httpMethod === 'PUT' && isId) {
      const id = lastPart;
      const body = JSON.parse(event.body || '{}');
      const updates = { ...body };

      if (client) {
        try {
          const sbUpdates = { ...updates };
          delete sbUpdates.medicines;
          await client.from('customers').update(sbUpdates).eq('id', id);
        } catch (e) {
          // Fallback to in-memory store
        }
      }

      const idx = mockCustomers.findIndex(c => String(c.id) === String(id));
      if (idx !== -1) {
        mockCustomers[idx] = { ...mockCustomers[idx], ...updates };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Customer updated successfully.' })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = (isId ? lastPart : null) || event.queryStringParameters?.id || (event.body ? JSON.parse(event.body).id : null);
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Customer ID required for deletion' })
        };
      }
      if (client) {
        try {
          await client.from('customers').delete().eq('id', id);
        } catch (e) {
          // Fallback to in-memory store
        }
      }
      mockCustomers = mockCustomers.filter(c => String(c.id) !== String(id));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: `Customer record #${id} removed successfully.` })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}
