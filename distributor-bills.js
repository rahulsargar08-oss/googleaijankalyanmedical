import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://dasjhsvfipsadrykdojv.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_-paESA8FXhYxAcP0UrBNXA_ZSkRJm9s';

let mockDistributorBills = [
  {
    id: 1,
    invoice_number: 'INV-2026-SS-0418',
    invoice_date: '2026-08-22',
    due_date: '2026-09-06',
    distributor_name: 'Shree Swami Samarth Pharma Distributors',
    distributor_phone: '9822145890',
    distributor_email: 'samarthpharma.solapur@gmail.com',
    distributor_address: 'Shop 14, Wholesale Medicine Market, Old Pune Naka, Solapur 413001',
    distributor_gstin: '27AAQCS8412K1ZA',
    drug_license_no: 'MH-SOL-20B-18491 / 21B-18492',
    items: [
      { name: 'Telmakind 40mg Tablet', batch: 'TLM-8491', expiry: '08/28', pack: '10x10', qty: 20, purchase_rate: 18.20, mrp: 34.00, gst_rate: 12, amount: 364.00 },
      { name: 'Dolo 650mg Tablet', batch: 'DL-2204', expiry: '11/27', pack: '15x10', qty: 30, purchase_rate: 21.50, mrp: 33.60, gst_rate: 12, amount: 645.00 },
      { name: 'Pan-D Capsules', batch: 'PND-1092', expiry: '04/28', pack: '10x15', qty: 15, purchase_rate: 110.00, mrp: 199.00, gst_rate: 12, amount: 1650.00 }
    ],
    subtotal: 2659.00,
    tax_rate: 12,
    cgst_amount: 159.54,
    sgst_amount: 159.54,
    total_tax: 319.08,
    discount_amount: 50.00,
    total_amount: 2928.00,
    paid_amount: 2928.00,
    balance_due: 0.00,
    payment_status: 'Paid',
    payment_mode: 'UPI / PhonePe',
    payment_reference: 'UPI-9481948192',
    notes: 'Paid in full on delivery via PhonePe. Batch verified into inventory.',
    created_at: '2026-08-22T10:30:00.000Z',
    updated_at: '2026-08-22T11:00:00.000Z'
  },
  {
    id: 2,
    invoice_number: 'CIP-PND-2026-892',
    invoice_date: '2026-08-25',
    due_date: '2026-09-10',
    distributor_name: 'Cipla Authorized Agency Pandharpur',
    distributor_phone: '9421033819',
    distributor_email: 'cipla.pandharpurdepot@gmail.com',
    distributor_address: 'Station Road, Near Railway Overbridge, Pandharpur 413304',
    distributor_gstin: '27AABCC1028L1ZT',
    drug_license_no: 'MH-PND-20B-44108 / 21B-44109',
    items: [
      { name: 'Azee 500 Tablets (Azithromycin)', batch: 'AZ-9021', expiry: '03/28', pack: '5x3', qty: 25, purchase_rate: 78.00, mrp: 132.00, gst_rate: 12, amount: 1950.00 },
      { name: 'Asthalin 200 Inhaler (Salbutamol)', batch: 'AST-552', expiry: '12/27', pack: '1 Inhaler', qty: 12, purchase_rate: 112.00, mrp: 168.00, gst_rate: 12, amount: 1344.00 },
      { name: 'Montair-LC Tablets', batch: 'MLC-774', expiry: '09/27', pack: '10x10', qty: 20, purchase_rate: 145.00, mrp: 248.00, gst_rate: 12, amount: 2900.00 }
    ],
    subtotal: 6194.00,
    tax_rate: 12,
    cgst_amount: 371.64,
    sgst_amount: 371.64,
    total_tax: 743.28,
    discount_amount: 0.00,
    total_amount: 6937.00,
    paid_amount: 4000.00,
    balance_due: 2937.00,
    payment_status: 'Partially Paid',
    payment_mode: 'Cheque',
    payment_reference: 'HDFC Cheque #004921',
    notes: 'Partial payment of ₹4,000 made via cheque. Remaining ₹2,937 due by 10 Sep 2026.',
    created_at: '2026-08-25T14:15:00.000Z',
    updated_at: '2026-08-25T15:20:00.000Z'
  },
  {
    id: 3,
    invoice_number: 'SUN-SOL-2026-1044',
    invoice_date: '2026-08-27',
    due_date: '2026-09-11',
    distributor_name: 'Sun Pharma Wholesale Agencies Solapur',
    distributor_phone: '9763299401',
    distributor_email: 'sunpharma.solapurwholesalers@gmail.com',
    distributor_address: 'Plot 88, MIDC Akkalkot Road, Solapur 413006',
    distributor_gstin: '27AAACS4912J1ZR',
    drug_license_no: 'MH-SOL-20B-39182 / 21B-39183',
    items: [
      { name: 'Volini Pain Relief Gel (75g)', batch: 'VL-410', expiry: '10/28', pack: '75g Tube', qty: 15, purchase_rate: 140.00, mrp: 210.00, gst_rate: 18, amount: 2100.00 },
      { name: 'Gemcal 500mg Softgels', batch: 'GMC-182', expiry: '05/28', pack: '15 Caps', qty: 30, purchase_rate: 168.00, mrp: 285.00, gst_rate: 12, amount: 5040.00 }
    ],
    subtotal: 7140.00,
    tax_rate: 14,
    cgst_amount: 491.40,
    sgst_amount: 491.40,
    total_tax: 982.80,
    discount_amount: 0.00,
    total_amount: 8123.00,
    paid_amount: 0.00,
    balance_due: 8123.00,
    payment_status: 'Pending',
    payment_mode: 'Credit (15 Days)',
    payment_reference: 'Bill Generated - Pending Cleared Payment',
    notes: '15 days credit period granted by Sun Pharma Solapur. Payment pending.',
    created_at: '2026-08-27T09:40:00.000Z',
    updated_at: '2026-08-27T09:40:00.000Z'
  },
  {
    id: 4,
    invoice_number: 'MKD-SNG-2026-077',
    invoice_date: '2026-08-26',
    due_date: '2026-09-25',
    distributor_name: 'Mankind Healthcare Dist. Sangola',
    distributor_phone: '8805188472',
    distributor_email: 'mankind.sangoladist@gmail.com',
    distributor_address: 'Opposite Panchayat Samiti, Miraj Road, Sangola 413307',
    distributor_gstin: '27AABCM7712E1ZU',
    drug_license_no: 'MH-SNG-20B-55102 / 21B-55103',
    items: [
      { name: 'Ascoril-D Cough Syrup (100ml)', batch: 'ASC-883', expiry: '01/28', pack: '100ml Bottle', qty: 40, purchase_rate: 82.00, mrp: 138.00, gst_rate: 12, amount: 3280.00 },
      { name: 'Moxikind-CV 625 Tablets', batch: 'MXK-199', expiry: '06/27', pack: '10x10', qty: 15, purchase_rate: 125.00, mrp: 205.00, gst_rate: 12, amount: 1875.00 }
    ],
    subtotal: 5155.00,
    tax_rate: 12,
    cgst_amount: 309.30,
    sgst_amount: 309.30,
    total_tax: 618.60,
    discount_amount: 0.00,
    total_amount: 5774.00,
    paid_amount: 5774.00,
    balance_due: 0.00,
    payment_status: 'Paid',
    payment_mode: 'Bank Transfer / NEFT',
    payment_reference: 'NEFT-SBIN20260826992',
    notes: 'Cleared via SBI Net Banking NEFT. Delivery received in store counter.',
    created_at: '2026-08-26T16:00:00.000Z',
    updated_at: '2026-08-26T16:45:00.000Z'
  }
];

let nextBillId = 5;

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

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = getSupabase();

  try {
    // 1. GET /distributor-bills
    if (event.httpMethod === 'GET') {
      let bills = [...mockDistributorBills];
      let source = 'mock_memory';

      if (supabase) {
        try {
          const { data, error } = await supabase.from('distributor_bills').select('*').order('created_at', { ascending: false });
          if (!error && Array.isArray(data)) {
            bills = data;
            source = 'supabase';
          }
        } catch (e) {
          // fallback
        }
      }

      const params = event.queryStringParameters || {};
      if (params.status && params.status !== 'All') {
        bills = bills.filter(b => (b.payment_status || '').toLowerCase() === params.status.toLowerCase());
      }
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        bills = bills.filter(b => 
          (b.invoice_number && b.invoice_number.toLowerCase().includes(q)) ||
          (b.distributor_name && b.distributor_name.toLowerCase().includes(q)) ||
          (b.distributor_gstin && b.distributor_gstin.toLowerCase().includes(q))
        );
      }

      const totalBilled = bills.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
      const totalPaid = bills.reduce((acc, b) => acc + (Number(b.paid_amount) || 0), 0);
      const totalDue = bills.reduce((acc, b) => acc + (Number(b.balance_due) || 0), 0);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          source,
          count: bills.length,
          bills,
          summary: {
            total_invoices: bills.length,
            total_billed_amount: Math.round(totalBilled),
            total_paid_amount: Math.round(totalPaid),
            total_balance_due: Math.round(totalDue),
            paid_count: bills.filter(b => (b.payment_status || '').toLowerCase() === 'paid').length,
            partial_count: bills.filter(b => (b.payment_status || '').toLowerCase().includes('partial')).length,
            pending_count: bills.filter(b => (b.payment_status || '').toLowerCase() === 'pending').length
          }
        })
      };
    }

    // 2. POST /distributor-bills
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      // Check if this is a payment recording
      if (body.action === 'record-payment' || (body.payment_amount && body.id && !body.distributor_name)) {
        const bill = mockDistributorBills.find(b => String(b.id) === String(body.id));
        if (!bill) {
          return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Bill not found' }) };
        }
        const payAmt = Number(body.payment_amount) || 0;
        bill.paid_amount = Math.min(bill.total_amount, (Number(bill.paid_amount) || 0) + payAmt);
        bill.balance_due = Math.max(0, bill.total_amount - bill.paid_amount);
        bill.payment_status = bill.balance_due <= 0 ? 'Paid' : 'Partially Paid';
        if (body.payment_mode) bill.payment_mode = body.payment_mode;
        bill.updated_at = new Date().toISOString();

        if (supabase) {
          try {
            await supabase.from('distributor_bills').update(bill).eq('id', body.id);
          } catch (e) {}
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, bill })
        };
      }

      if (!body.distributor_name || !body.invoice_number) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Distributor name and Invoice number required.' })
        };
      }

      const now = new Date().toISOString();
      const newBill = {
        id: nextBillId++,
        invoice_number: body.invoice_number.trim(),
        invoice_date: body.invoice_date || now.split('T')[0],
        due_date: body.due_date || '',
        distributor_name: body.distributor_name.trim(),
        distributor_phone: (body.distributor_phone || '').trim(),
        distributor_email: (body.distributor_email || '').trim(),
        distributor_address: (body.distributor_address || '').trim(),
        distributor_gstin: (body.distributor_gstin || '').trim(),
        drug_license_no: (body.drug_license_no || '').trim(),
        items: Array.isArray(body.items) ? body.items : [],
        subtotal: Number(body.subtotal) || 0,
        tax_rate: Number(body.tax_rate) || 12,
        cgst_amount: Number(body.cgst_amount) || 0,
        sgst_amount: Number(body.sgst_amount) || 0,
        total_tax: Number(body.total_tax) || 0,
        discount_amount: Number(body.discount_amount) || 0,
        total_amount: Number(body.total_amount) || 0,
        paid_amount: Number(body.paid_amount) || 0,
        balance_due: Math.max(0, (Number(body.total_amount) || 0) - (Number(body.paid_amount) || 0)),
        payment_status: body.payment_status || 'Pending',
        payment_mode: body.payment_mode || 'Credit (15 Days)',
        payment_reference: body.payment_reference || '',
        notes: body.notes || '',
        created_at: now,
        updated_at: now
      };

      if (supabase) {
        try {
          const { data } = await supabase.from('distributor_bills').insert([newBill]).select().single();
          if (data && data.id) newBill.id = data.id;
        } catch (e) {}
      }

      mockDistributorBills.unshift(newBill);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, bill: newBill })
      };
    }

    // 3. PUT /distributor-bills
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const id = body.id;
      const idx = mockDistributorBills.findIndex(b => String(b.id) === String(id));
      if (idx !== -1) {
        mockDistributorBills[idx] = { ...mockDistributorBills[idx], ...body, updated_at: new Date().toISOString() };
        if (supabase) {
          try {
            await supabase.from('distributor_bills').update(mockDistributorBills[idx]).eq('id', id);
          } catch (e) {}
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, bill: mockDistributorBills[idx] }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Bill not found' }) };
    }

    // 4. DELETE /distributor-bills
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const id = params.id;
      if (id) {
        mockDistributorBills = mockDistributorBills.filter(b => String(b.id) !== String(id));
        if (supabase) {
          try {
            await supabase.from('distributor_bills').delete().eq('id', id);
          } catch (e) {}
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: `Bill #${id} deleted.` }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Internal Server Error' })
    };
  }
};
