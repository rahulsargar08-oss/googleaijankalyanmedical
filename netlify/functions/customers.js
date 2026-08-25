import { createClient } from '@supabase/supabase-js';

// In-memory fallback for serverless invocation
let mockCustomers = [
  {
    id: 101,
    full_name: 'Ananda Deshmukh',
    mobile_number: '9822014589',
    address: 'Near S.T. Stand, Sangola, Solapur',
    age: 58,
    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiologist)',
    required_tablet: 'Telma 40mg (1 Strip), Ecosprin 75mg (1 Strip)',
    status: 'Pending',
    notes: 'Requires 24x7 home delivery. Patient has hypertension history.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 102,
    full_name: 'Sunita Vijay Shinde',
    mobile_number: '9421039872',
    address: 'Wadhegaon Road, Sangola - 413307',
    age: 42,
    preferred_doctor: 'Dr. Patil Hospital Sangola',
    required_tablet: 'Pan-D (Pantoprazole + Domperidone) 15 Capsules',
    status: 'Dispensed',
    notes: 'Prescription verified. Store pickup completed.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 103,
    full_name: 'Tanaji Baburao Mane',
    mobile_number: '9763254109',
    address: 'Nazar Camp, Sangola',
    age: 64,
    preferred_doctor: 'Dr. Shinde (Diabetologist)',
    required_tablet: 'Glycomet 500mg (2 Strips), Calpol 650mg (1 Strip)',
    status: 'Processing',
    notes: 'Cold-chain insulin pack requested for tomorrow morning.',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  },
  {
    id: 104,
    full_name: 'Pooja Sachin Gaikwad',
    mobile_number: '8805123984',
    address: 'Mahatma Phule Chowk, Sangola',
    age: 29,
    preferred_doctor: 'Dr. Mrs. Jadhav (Pediatrician)',
    required_tablet: 'Calpol 250 Peadiatric Syrup, Nestlé Cerelac Stage 2',
    status: 'Pending',
    notes: 'Urgent baby care requirement.',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString()
  }
];

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
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
      const { full_name, mobile_number, address, age, preferred_doctor, required_tablet, status, notes } = body;

      if (!full_name || !mobile_number || !required_tablet) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Full Name, Mobile, and Required Tablet are required.' })
        };
      }

      const newCustomer = {
        full_name: full_name.trim(),
        mobile_number: mobile_number.trim(),
        address: (address || 'Sangola').trim(),
        age: age ? parseInt(age, 10) || null : null,
        preferred_doctor: (preferred_doctor || 'General Consultation / Self').trim(),
        required_tablet: required_tablet.trim(),
        status: status || 'Pending',
        notes: (notes || '').trim(),
        created_at: new Date().toISOString()
      };

      let saved = null;
      let source = 'local';

      if (client) {
        try {
          const { data, error } = await client.from('customers').insert([newCustomer]).select().single();
          if (!error && data) {
            saved = data;
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
          await client.from('customers').update(updates).eq('id', id);
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
