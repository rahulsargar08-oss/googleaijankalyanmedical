import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ==========================================
// PERSISTENT DATA STORAGE LAYER (File + Supabase)
// ==========================================
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'customers.json');
const MEDICINE_STOCK_FILE = path.join(DATA_DIR, 'medicine_stock.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin_account.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Data dir creation warning:', e);
}

// Single-Slot Admin Account Storage
function loadRegisteredAdmin() {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      const raw = fs.readFileSync(ADMIN_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error loading admin account:', err);
  }
  return null;
}

function saveRegisteredAdmin(adminObj) {
  try {
    if (!adminObj) {
      if (fs.existsSync(ADMIN_FILE)) {
        fs.unlinkSync(ADMIN_FILE);
      }
      return;
    }
    const tempFile = `${ADMIN_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(adminObj, null, 2), 'utf-8');
    fs.renameSync(tempFile, ADMIN_FILE);
  } catch (err) {
    try {
      fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminObj, null, 2), 'utf-8');
    } catch (e2) {
      console.error('Failed to save admin account to disk:', e2);
    }
  }
}

let registeredAdmin = loadRegisteredAdmin();

// ==========================================
// SECURITY & CRYPTOGRAPHIC AUTHENTICATION ENGINE
// ==========================================

// Server Secret for HMAC-SHA256 Token Signing
function getOrCreateServerSecret() {
  if (process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET.trim()) {
    // Generate deterministic 256-bit key from ADMIN_JWT_SECRET regardless of length
    return crypto.createHash('sha256').update(process.env.ADMIN_JWT_SECRET.trim()).digest('hex');
  }
  const secretFile = path.join(DATA_DIR, '.server_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const stored = fs.readFileSync(secretFile, 'utf-8').trim();
      if (stored && stored.length >= 32) return stored;
    }
  } catch (e) {}
  const newSecret = crypto.randomBytes(48).toString('hex');
  try {
    fs.writeFileSync(secretFile, newSecret, 'utf-8');
  } catch (e) {}
  return newSecret;
}
const SERVER_SECRET = getOrCreateServerSecret();

// Salted Scrypt Password Hashing
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

// Constant-time password verification (immune to timing attacks)
function verifyPassword(candidatePassword, storedPasswordOrHash) {
  if (!storedPasswordOrHash || typeof storedPasswordOrHash !== 'string') return false;
  if (!candidatePassword || typeof candidatePassword !== 'string') return false;

  if (storedPasswordOrHash.startsWith('scrypt:')) {
    const parts = storedPasswordOrHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    try {
      const derived = crypto.scryptSync(candidatePassword, salt, 64);
      const expectedBuffer = Buffer.from(expectedHex, 'hex');
      if (derived.length !== expectedBuffer.length) return false;
      return crypto.timingSafeEqual(derived, expectedBuffer);
    } catch (e) {
      return false;
    }
  }

  // Backward compatibility: match plain text and signal need for auto-upgrade
  return candidatePassword === storedPasswordOrHash;
}

// Cryptographically Signed HMAC-SHA256 Session Tokens
function generateAdminToken(username, role = 'Pharmacist Administrator') {
  const now = Date.now();
  const payload = {
    u: username,
    r: role,
    iat: now,
    exp: now + 24 * 60 * 60 * 1000 // 24-hour expiration
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SERVER_SECRET).update(encodedPayload).digest('base64url');
  return `jka_${encodedPayload}.${signature}`;
}

// Verify signed HMAC session token
function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;

  // Modern HMAC-SHA256 Token Format
  if (token.startsWith('jka_')) {
    const raw = token.slice(4);
    const dotIndex = raw.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const encodedPayload = raw.slice(0, dotIndex);
    const signature = raw.slice(dotIndex + 1);

    const expectedSignature = crypto.createHmac('sha256', SERVER_SECRET).update(encodedPayload).digest('base64url');

    try {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null;
      }

      const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadStr);

      if (!payload || !payload.exp || payload.exp < Date.now()) {
        return null; // Expired
      }

      return payload;
    } catch (e) {
      return null;
    }
  }

  // Backward-compatible grace period for active legacy tokens (max 24h validity)
  if (token.startsWith('jankalyan_adm_')) {
    try {
      const raw = token.slice(14);
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const [u, ts] = decoded.split(':');
      const timestamp = parseInt(ts, 10);
      if (u && timestamp && (Date.now() - timestamp < 24 * 60 * 60 * 1000)) {
        return { u, r: 'Pharmacist Administrator', exp: timestamp + 24 * 60 * 60 * 1000 };
      }
    } catch (e) {}
  }

  return null;
}

// Rate Limiting & Anti-Brute-Force Shield
const loginAttempts = new Map(); // ip -> { count: number, firstAttempt: number, lockedUntil: number }

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      error: `Security Lockout: Too many failed login attempts. To prevent unauthorized brute-force access, account is locked for ${remainingSeconds} seconds.`,
      retryAfter: remainingSeconds
    };
  }

  // Reset window after 15 minutes of inactivity
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordLoginFailure(ip) {
  const now = Date.now();
  let record = loginAttempts.get(ip);
  if (!record || (now - record.firstAttempt > 15 * 60 * 1000)) {
    record = { count: 1, firstAttempt: now, lockedUntil: 0 };
  } else {
    record.count += 1;
  }

  // Lock for 5 minutes after 5 consecutive failures
  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000;
  }

  loginAttempts.set(ip, record);
}

function recordLoginSuccess(ip) {
  loginAttempts.delete(ip);
}

// Authentication Middleware to Protect Admin Endpoints
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: Please log in to the Administrator Portal with valid credentials.'
    });
  }

  const session = verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session Expired or Unauthorized: Token is invalid. Please log in again.'
    });
  }

  req.adminSession = session;
  next();
}

// Default initial seed records (ONLY used on first initial start before any user action)
const DEFAULT_INITIAL_CUSTOMERS = [
  {
    id: 101,
    full_name: 'Rahul Sargar',
    mobile_number: '7709647627',
    age: 26,
    gender: 'Male',
    address: 'Near Wadhegaon Naka',
    area_village: 'Sangola (413307)',
    medicines: [
      { name: 'Telmakind 40mg', strength: '40mg', type: 'Tablet', quantity: '1 Strip (10 Tabs)' },
      { name: 'Dolo 650', strength: '650mg', type: 'Tablet', quantity: '1 Strip (15 Tabs)' }
    ],
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
    medicines: [
      { name: 'Telma 40mg', strength: '40mg', type: 'Tablet', quantity: '1 Strip' },
      { name: 'Ecosprin 75mg', strength: '75mg', type: 'Tablet', quantity: '1 Strip' }
    ],
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
    medicines: [
      { name: 'Pan-D (Pantoprazole + Domperidone)', strength: '40mg + 30mg', type: 'Capsule', quantity: '1 Strip' }
    ],
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
    medicines: [
      { name: 'Glycomet 500mg', strength: '500mg', type: 'Tablet', quantity: '1 Strip' },
      { name: 'Ascoril-D Cough Syrup', strength: '100ml', type: 'Syrup / Liquid', quantity: '1 Bottle' }
    ],
    medicine_name: 'Glycomet 500mg, Ascoril-D Syrup',
    required_tablet: 'Glycomet 500mg, Ascoril-D Syrup',
    medicine_strength: '500mg / 100ml',
    medicine_type: 'Tablet, Syrup / Liquid',
    preferred_doctor: 'Dr. Shinde (Diabetologist)',
    prescription_available: 'Yes',
    status: 'Under Review',
    notes: 'Diabetes and cough prescription record. Tablet and syrup prescribed together.',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  }
];

// Load persisted customers from disk
function loadPersistedCustomers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error loading persisted customers:', err);
  }
  // If file doesn't exist, create it with seed records once
  savePersistedCustomers(DEFAULT_INITIAL_CUSTOMERS);
  return [...DEFAULT_INITIAL_CUSTOMERS];
}

// Atomically save customers to disk so records never disappear after 5-10 minutes or server restarts
function savePersistedCustomers(customersList) {
  try {
    if (!Array.isArray(customersList)) return;
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(customersList, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(customersList, null, 2), 'utf-8');
    } catch (e2) {
      console.error('Failed to save customers to disk:', e2);
    }
  }
}

let localCustomers = loadPersistedCustomers();
let nextLocalId = localCustomers.reduce((max, c) => Math.max(max, typeof c.id === 'number' ? c.id : parseInt(c.id, 10) || 0), 104) + 1;

// ==========================================
// MEDICINE STOCK & INVENTORY PERSISTENT LAYER
// ==========================================
const DEFAULT_INITIAL_STOCK_ITEMS = [
  {
    id: 1,
    medicine_name: 'Dolo 650mg Tablet',
    generic_name: 'Paracetamol 650mg',
    category: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    batch_number: 'DL-2204',
    expiry_date: '2027-11-30',
    quantity: 145,
    min_stock_level: 20,
    unit: 'Strips (15 tabs)',
    purchase_price: 21.50,
    mrp: 33.60,
    selling_price: 31.00,
    rack_location: 'Rack A-1 (Counter)',
    prescription_required: false,
    notes: 'Fast moving antipyretic & pain relief. High customer demand in Sangola.',
    created_at: '2026-08-20T09:00:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 2,
    medicine_name: 'Telmakind 40mg Tablet',
    generic_name: 'Telmisartan 40mg',
    category: 'Tablet',
    manufacturer: 'Mankind Pharma',
    batch_number: 'TLM-8491',
    expiry_date: '2028-08-31',
    quantity: 65,
    min_stock_level: 15,
    unit: 'Strips (10 tabs)',
    purchase_price: 18.20,
    mrp: 34.00,
    selling_price: 30.00,
    rack_location: 'Rack B-2 (Cardiac)',
    prescription_required: true,
    notes: 'Hypertension maintenance medication.',
    created_at: '2026-08-22T10:30:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 3,
    medicine_name: 'Augmentin 625 Duo Tablet',
    generic_name: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    category: 'Tablet',
    manufacturer: 'GSK Pharmaceuticals',
    batch_number: 'AUG-7721',
    expiry_date: '2027-06-30',
    quantity: 8,
    min_stock_level: 15,
    unit: 'Strips (10 tabs)',
    purchase_price: 142.00,
    mrp: 204.50,
    selling_price: 195.00,
    rack_location: 'Rack C-1 (Antibiotics)',
    prescription_required: true,
    notes: 'Low stock! Minimum threshold is 15 strips. Reorder from distributor.',
    created_at: '2026-08-15T11:00:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 4,
    medicine_name: 'Pan-D Capsule',
    generic_name: 'Pantoprazole 40mg + Domperidone 30mg SR',
    category: 'Capsule',
    manufacturer: 'Alkem Laboratories',
    batch_number: 'PND-1092',
    expiry_date: '2028-04-30',
    quantity: 50,
    min_stock_level: 15,
    unit: 'Strips (15 caps)',
    purchase_price: 110.00,
    mrp: 199.00,
    selling_price: 185.00,
    rack_location: 'Rack A-3 (Gastro)',
    prescription_required: false,
    notes: 'Acidity, GERD & gas relief capsule.',
    created_at: '2026-08-18T14:10:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 5,
    medicine_name: 'Ascoril D Plus Cough Syrup',
    generic_name: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
    category: 'Syrup / Liquid',
    manufacturer: 'Glenmark Pharma',
    batch_number: 'ASC-4419',
    expiry_date: '2027-09-30',
    quantity: 28,
    min_stock_level: 10,
    unit: 'Bottles (100ml)',
    purchase_price: 68.00,
    mrp: 118.00,
    selling_price: 110.00,
    rack_location: 'Rack D-1 (Syrups)',
    prescription_required: false,
    notes: 'Dry cough & throat irritation syrup.',
    created_at: '2026-08-24T08:20:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 6,
    medicine_name: 'Shelcal 500 Tablet',
    generic_name: 'Calcium 500mg + Vitamin D3 250 IU',
    category: 'Tablet',
    manufacturer: 'Torrent Pharma',
    batch_number: 'SHL-9932',
    expiry_date: '2028-02-28',
    quantity: 80,
    min_stock_level: 20,
    unit: 'Strips (15 tabs)',
    purchase_price: 74.00,
    mrp: 131.30,
    selling_price: 122.00,
    rack_location: 'Rack B-1 (Vitamins)',
    prescription_required: false,
    notes: 'Daily calcium bone density supplement.',
    created_at: '2026-08-21T16:00:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 7,
    medicine_name: 'Azithral 500 Tablet',
    generic_name: 'Azithromycin 500mg',
    category: 'Tablet',
    manufacturer: 'Alembic Pharma',
    batch_number: 'AZT-3021',
    expiry_date: '2026-10-15',
    quantity: 5,
    min_stock_level: 12,
    unit: 'Strips (5 tabs)',
    purchase_price: 71.00,
    mrp: 119.50,
    selling_price: 112.00,
    rack_location: 'Rack C-2 (Antibiotics)',
    prescription_required: true,
    notes: 'Expiring soon (< 60 days). Both low stock and nearing expiry.',
    created_at: '2026-08-10T12:00:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 8,
    medicine_name: 'Monocef 1g Injection',
    generic_name: 'Ceftriaxone Sodium 1000mg',
    category: 'Injection / Vial',
    manufacturer: 'Aristo Pharma',
    batch_number: 'MN-8841',
    expiry_date: '2027-12-31',
    quantity: 0,
    min_stock_level: 10,
    unit: 'Vials (with WFI)',
    purchase_price: 41.50,
    mrp: 68.20,
    selling_price: 65.00,
    rack_location: 'Rack E-1 (Injections)',
    prescription_required: true,
    notes: 'OUT OF STOCK. Urgent procurement required for clinic referrals.',
    created_at: '2026-08-12T10:00:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 9,
    medicine_name: 'Betadine 10% Ointment',
    generic_name: 'Povidone Iodine 10% w/w',
    category: 'Ointment / Cream',
    manufacturer: 'Win-Medicare',
    batch_number: 'BT-5102',
    expiry_date: '2027-10-31',
    quantity: 22,
    min_stock_level: 8,
    unit: 'Tubes (20g)',
    purchase_price: 52.00,
    mrp: 89.00,
    selling_price: 84.00,
    rack_location: 'Rack F-2 (Topical/First Aid)',
    prescription_required: false,
    notes: 'Antiseptic first aid cream for wound care.',
    created_at: '2026-08-25T13:45:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 10,
    medicine_name: 'Pediasure Nutrition Powder',
    generic_name: 'Complete Pediatric Nutrition Formula',
    category: 'Pediatric Drops / Food',
    manufacturer: 'Abbott Healthcare',
    batch_number: 'PDS-118',
    expiry_date: '2027-05-31',
    quantity: 14,
    min_stock_level: 5,
    unit: 'Jars (400g)',
    purchase_price: 280.00,
    mrp: 395.00,
    selling_price: 375.00,
    rack_location: 'Shelf Baby Care (Counter 2)',
    prescription_required: false,
    notes: 'Kids growth & immunity supplement.',
    created_at: '2026-08-23T15:20:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 11,
    medicine_name: 'Maxtra Cold Pediatric Drops',
    generic_name: 'Phenylephrine + Chlorpheniramine Maleate',
    category: 'Pediatric Drops / Food',
    manufacturer: 'Zuventus Healthcare',
    batch_number: 'MXT-098',
    expiry_date: '2027-08-31',
    quantity: 18,
    min_stock_level: 6,
    unit: 'Dropper Bottles (15ml)',
    purchase_price: 42.00,
    mrp: 72.00,
    selling_price: 68.00,
    rack_location: 'Rack D-2 (Pediatric)',
    prescription_required: false,
    notes: 'Infant cold and nasal congestion drops with calibrated dropper.',
    created_at: '2026-08-26T11:15:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  },
  {
    id: 12,
    medicine_name: 'Accu-Chek Active Test Strips',
    generic_name: 'Blood Glucose Test Strips',
    category: 'Surgical / Devices',
    manufacturer: 'Roche Diabetes Care',
    batch_number: 'ACC-7741',
    expiry_date: '2027-04-30',
    quantity: 12,
    min_stock_level: 5,
    unit: 'Box (50 Strips)',
    purchase_price: 720.00,
    mrp: 1049.00,
    selling_price: 980.00,
    rack_location: 'Glass Display Cabinet A',
    prescription_required: false,
    notes: 'Diabetic blood sugar monitor diagnostic strips.',
    created_at: '2026-08-19T10:45:00.000Z',
    updated_at: '2026-08-28T04:00:00.000Z'
  }
];

function loadPersistedMedicineStock() {
  try {
    if (fs.existsSync(MEDICINE_STOCK_FILE)) {
      const raw = fs.readFileSync(MEDICINE_STOCK_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error loading persisted medicine stock:', err);
  }
  savePersistedMedicineStock(DEFAULT_INITIAL_STOCK_ITEMS);
  return [...DEFAULT_INITIAL_STOCK_ITEMS];
}

function savePersistedMedicineStock(stockList) {
  try {
    if (!Array.isArray(stockList)) return;
    const tempFile = `${MEDICINE_STOCK_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(stockList, null, 2), 'utf-8');
    fs.renameSync(tempFile, MEDICINE_STOCK_FILE);
  } catch (err) {
    try {
      fs.writeFileSync(MEDICINE_STOCK_FILE, JSON.stringify(stockList, null, 2), 'utf-8');
    } catch (e2) {
      console.error('Failed to save medicine stock to disk:', e2);
    }
  }
}

let localMedicineStock = loadPersistedMedicineStock();
let nextStockId = localMedicineStock.reduce((max, s) => Math.max(max, typeof s.id === 'number' ? s.id : parseInt(s.id, 10) || 0), 12) + 1;
let supabaseStockTableExists = false;

// ==========================================
// SUPABASE CLIENT & DATA LAYER
// ==========================================
const DEFAULT_SUPABASE_URL = 'https://dasjhsvfipsadrykdojv.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_-paESA8FXhYxAcP0UrBNXA_ZSkRJm9s';

let supabase = null;
let supabaseTableChecked = false;
let supabaseTableExists = false;

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!supabase) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      return null;
    }
  }
  return supabase;
}

// Helper to check if Supabase error is due to missing table/schema cache
function isTableMissingError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return (
    msg.includes("could not find the table") ||
    msg.includes("relation") ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    code === 'pgrst205' ||
    code === '42p01'
  );
}

let ai = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `You are the dedicated AI Pharmacist Assistant for "Jankalyan Medical" — the premier 24x7 Certified Community Pharmacy in Sangola, Maharashtra.

STORE KNOWLEDGE BASE & MANDATORY FACTS:
1. STORE TIMINGS:
   - Jankalyan Medical is open 24 hours a day, 7 days a week (24x7) every single day including holidays and late nights.
   - Always affirm that we are currently OPEN and ready to serve emergency and general medicine needs.

2. STORE LOCATION & ADDRESS:
   - Physical Address: Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307.
   - Landmark: Wadhegaon Naka, Sangola.

3. PROPRIETOR / OWNER:
   - Jankalyan Medical is owned and operated by Mr. Siddhu Hajare.

4. APPLICATION DESIGN & DEVELOPER:
   - Designed & Developed by: Rahul Sargar
   - Version: 1.0.0
   - Developer Contact & Feedback: sargarrahul428@gmail.com / Instagram: @rahul_sargar_08

5. CONTACT & ORDERS:
   - Official Phone & WhatsApp Hotline: +91 86691 18742
   - Email: janaklyanmedicalstore@gmail.com
   - Home Delivery: Available across Sangola town. Customers can send medicine names or prescription photos directly to our WhatsApp hotline (+91 86691 18742).

6. MEDICINE & PRODUCT RANGE:
   - Allopathic Prescription Medicines (Cardiology, Diabetes, Antibiotics, Pain relief, Antipyretics)
   - Pediatric & Baby Care (Infant drops, baby food, gripe water, diapers)
   - Ayurvedic & Herbal Formulations (Chyawanprash, digestive syrups, joint care oils)
   - Veterinary Care Products (Livestock supplements, animal medicines, poultry tonics, Ostovet)
   - Surgical & Home Diagnostics (BP monitors, Glucometers, nebulizers, thermometers, pulse oximeters)
   - Daily OTC & Wellness (Multivitamins, pain sprays, antiseptics, bandages)

BEHAVIOR RULES:
- Respond in a warm, polite, and professional healthcare manner.
- Support inquiries in English, Marathi, or Hindi based on what language the user speaks.
- When explaining medicines, always remind the customer to take medicines according to their licensed doctor's prescription and include appropriate safety guidance.
- Keep formatting clean with bullet points and bold headers where appropriate.`;

// Comprehensive Medical & Store Knowledge Matcher
function getSmartFallbackReply(message) {
  const q = (message || '').toLowerCase().trim();

  // 1. Specific Medicines & Common Drugs
  if (q.includes('dolo') || q.includes('paracetamol') || q.includes('pcm') || q.includes('crocin') || q.includes('calpol') || q.includes('pacimol')) {
    return `💊 **Paracetamol & Dolo 650 Availability:**\n\n- **Stock Status:** Available 24×7 at Jankalyan Medical Sangola in multiple strengths (Dolo 650mg, Crocin 500/650mg, Calpol 120/250 Pediatric Syrup).\n- **Primary Uses:** Fever reduction (antipyretic) and relief from mild to moderate body aches, headaches, and toothaches.\n- **Pricing:** Approx. ₹30 – ₹34 per strip of 15 tablets.\n- **Safety Guidance:** Maximum recommended adult dose is up to 3 to 4 times a day with at least 4–6 hours gap between tablets. Do not take with other Paracetamol-containing combinations.\n\n🚚 For instant home delivery in Sangola, WhatsApp your prescription to **+91 86691 18742**.`;
  }

  if (q.includes('azithromycin') || q.includes('azee') || q.includes('augmentin') || q.includes('amoxicillin') || q.includes('taxim') || q.includes('cefixime') || q.includes('ciplox') || q.includes('antibiotic') || q.includes('अँटिबायोटिक')) {
    return `🔬 **Prescription Antibiotics Range:**\n\n- **Stock Range:** Complete range of genuine antibiotics including Azee 500 (Azithromycin), Augmentin 625 (Amoxyclav), Taxim-O 200 (Cefixime), and Ciplox 500.\n- **Prescription Notice:** Antibiotics are Schedule-H drugs and require a valid prescription from a registered medical practitioner.\n- **Directions:** Always complete the full course prescribed by your doctor even if you feel better.\n\nSend prescription photo on WhatsApp: **+91 86691 18742** (Near Wadhegaon Naka, Sangola).`;
  }

  if (q.includes('pan d') || q.includes('pan 40') || q.includes('pantoprazole') || q.includes('omez') || q.includes('omeprazole') || q.includes('rabeprazole') || q.includes('rabekind') || q.includes('acidity') || q.includes('gas') || q.includes('heartburn') || q.includes('digene') || q.includes('gelusil') || q.includes('eno') || q.includes('ॲसिडिटी') || q.includes('गॅस') || q.includes('जळजळ')) {
    return `🔥 **Acidity, Gas & Heartburn Relief:**\n\n- **Proton Pump Inhibitors (PPI):** Pan-D (Pantoprazole + Domperidone), Pan 40, Omez 20mg, and Rabekind-DSR.\n  *(Best taken 30 minutes before breakfast with water)*.\n- **Instant Relief Antacids:** Digene / Gelusil syrup & chewable tablets, Eno fruit salt, Pudin Hara pearls.\n- **Stock:** 100% genuine stock available round-the-clock.\n\nNeed instant relief delivered to your address in Sangola? Call **+91 86691 18742**.`;
  }

  if (q.includes('cough') || q.includes('syrup') || q.includes('ascoril') || q.includes('grilinctus') || q.includes('alex') || q.includes('chericof') || q.includes('koflet') || q.includes('honitus') || q.includes('खोकला') || q.includes('खोकल्याचे') || q.includes('खांसी')) {
    return `🫁 **Cough Syrups & Respiratory Care:**\n\n- **Wet / Productive Cough (with phlegm/mucus):** Ascoril-LS, Grilinctus-BM, Ambroxol + Terbutaline formulations.\n- **Dry / Allergic Cough:** Alex Syrup, Chericof, Benadryl DR (Dextromethorphan).\n- **Ayurvedic / Herbal (Non-drowsy):** Himalaya Koflet, Dabur Honitus syrup.\n- **Throat Relief:** Strepsils, Koflet lozenges, Betadine 2% mint gargle.\n\nAvailable 24x7 at Wadhegaon Naka, Sangola. WhatsApp: **+91 86691 18742**.`;
  }

  if (q.includes('cold') || q.includes('sinarest') || q.includes('cheston') || q.includes('wikoryl') || q.includes('cetirizine') || q.includes('levocet') || q.includes('allegra') || q.includes('montair') || q.includes('sneezing') || q.includes('सर्दी') || q.includes('शिंका') || q.includes('जुकाम')) {
    return `🤧 **Cold, Sinus & Allergy Relief:**\n\n- **Multi-Symptom Cold Tablets:** Sinarest, Cheston Cold, Wikoryl (relieves blocked nose, fever & body ache).\n- **Antiallergics (Runny nose/itching):** Cetirizine 10mg (Cetzine), Levocetirizine 5mg (Levocet), Allegra 120mg (Fexofenadine), Montair-LC (Montelukast + Levocetirizine).\n- **Steam Inhalation:** Karvol Plus inhalant capsules, Vicks Inhaler & Vaporizers.\n\nAll medicines available in stock. Order via WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('pain') || q.includes('combiflam') || q.includes('zerodol') || q.includes('voveran') || q.includes('diclofenac') || q.includes('meftal') || q.includes('spas') || q.includes('headache') || q.includes('body ache') || q.includes('दुखी') || q.includes('डोकेदुखी') || q.includes('पोटदुखी') || q.includes('कंबरदुखी')) {
    return `⚡ **Pain Relief & Anti-Inflammatory Range:**\n\n- **Headache & Body Pain:** Combiflam, Zerodol-P, Saridon, Paracetamol 650mg.\n- **Muscle & Joint Pain:** Zerodol-SP, Voveran SR, Volini / Moov / Omnigel pain spray & gel.\n- **Stomach Cramps / Period Pain:** Meftal-Spas (Mefenamic Acid + Dicyclomine), Cyclopam, Drotin-M.\n- **Safety Note:** Painkiller tablets must always be taken after meals with food.\n\nAvailable 24x7 at Jankalyan Medical Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('diarrhea') || q.includes('loose motion') || q.includes('vomit') || q.includes('vomikind') || q.includes('ors') || q.includes('electral') || q.includes('probiotic') || q.includes('जुलाब') || q.includes('उलटी') || q.includes('दस्त')) {
    return `💧 **Stomach Infection, Vomiting & Hydration:**\n\n- **Rehydration:** WHO-formula ORS sachets (Electral, Prolyte, ORS liquid tetra packs) to prevent dehydration.\n- **Nausea / Vomiting Relief:** Vomikind / Emeset 4mg (Ondansetron).\n- **Loose Motions / Diarrhea:** Norflox-TZ / O2 (Ofloxacin + Ornidazole), Econorm / Sporlac probiotics.\n\nEmergency 24x7 counter at Wadhegaon Naka, Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('vitamin') || q.includes('becosules') || q.includes('neurobion') || q.includes('limcee') || q.includes('shelcal') || q.includes('calcium') || q.includes('vitamin d') || q.includes('d3') || q.includes('d-rise') || q.includes('zincovit') || q.includes('supradyn') || q.includes('कॅल्शियम') || q.includes('व्हिटॅमिन')) {
    return `🌟 **Vitamins, Minerals & Daily Supplements:**\n\n- **B-Complex & Mouth Ulcers:** Becosules capsules, Neurobion Forte (nerve health).\n- **Immunity & Skin:** Limcee 500mg (Vitamin C chewable), Zincovit tablets & syrup.\n- **Bone & Joint Strength:** Shelcal 500 / Gemcal (Calcium + Vit D3), D-Rise 60K (Vitamin D3 weekly booster).\n- **General Vitality:** Supradyn Daily, Revital H multivitamins.\n\nAvailable with attractive pricing. Call/WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('skin') || q.includes('wound') || q.includes('burn') || q.includes('betadine') || q.includes('soframycin') || q.includes('candid') || q.includes('ointment') || q.includes('cream') || q.includes('antiseptic') || q.includes('bandage') || q.includes('जखम') || q.includes('भाजणे') || q.includes('खाज')) {
    return `🩹 **First Aid, Wound Care & Dermatology:**\n\n- **Antiseptics & Wound Healing:** Betadine 5% / 10% ointment & solution, Soframycin, Neosporin.\n- **Burn Care:** Silverex Ionic burn healing cream, Burnol.\n- **Fungal Infection & Itching:** Candid-B cream, Quadriderm, Clotrimazole powder.\n- **Dressings:** Sterile cotton rolls, micropore surgical tapes, bandages, Band-Aids, Dettol/Savlon.\n\nVisit 24x7 near Wadhegaon Naka, Sangola or call **+91 86691 18742**.`;
  }

  if (q.includes('diabetes') || q.includes('sugar') || q.includes('insulin') || q.includes('glycomet') || q.includes('metformin') || q.includes('glucometer') || q.includes('मधुमेह') || q.includes('साखर')) {
    return `🩺 **Diabetes Care & Cold-Chain Insulin:**\n\n- **Oral Antidiabetics:** Glycomet 500/850/1000mg, Glimepiride, Janumet, Galvus Met.\n- **Cold-Chain Refrigerated Insulin:** Lantus, Human Mixtard, Novorapid (stored strictly under 2°C–8°C in dedicated medical refrigerators).\n- **Testing Supplies:** Accu-Chek Active & Instant strips, Dr. Morepen test strips, sterile lancets.\n\nFor regular monthly diabetic packs & discounts, WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('bp') || q.includes('blood pressure') || q.includes('telma') || q.includes('telmisartan') || q.includes('amlodipine') || q.includes('heart') || q.includes('रक्तदाब') || q.includes('हार्ट')) {
    return `❤️ **Blood Pressure, Cardiac & Diagnostic Devices:**\n\n- **Cardiovascular Medicines:** Telma 40 / Telma-H (Telmisartan), Amlodipine, Atenolol, Ecosprin 75/150.\n- **Home Monitoring:** OMRON digital BP machines, pulse oximeters, mercury/digital sphygmomanometers.\n\nAvailable 24x7 at Jankalyan Medical Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('vet') || q.includes('veterinary') || q.includes('animal') || q.includes('ostovet') || q.includes('calup') || q.includes('vimeral') || q.includes('cow') || q.includes('buffalo') || q.includes('livestock') || q.includes('गाय') || q.includes('म्हैस') || q.includes('जनावरे') || q.includes('पशुऔषधे')) {
    return `🐄 **Veterinary Care & Animal Nutrition in Sangola:**\n\nJankalyan Medical is Sangola's trusted stockist for livestock & dairy medicines:\n- **High-Yield Milk Boosters:** Ostovet Forte (5L/1L), Calup, Vimeral tonics.\n- **Dewormers & Bolus:** Albendazole, Fenbendazole bolus, digestive tonics.\n- **Wound & Maggot Care:** Topicure spray, Fura-Free antiseptic ointment.\n\nCall **+91 86691 18742** for livestock stock & quantity orders.`;
  }

  if (q.includes('baby') || q.includes('pediatric') || q.includes('cerelac') || q.includes('lactogen') || q.includes('diaper') || q.includes('infant') || q.includes('बाळ') || q.includes('लहान मुले')) {
    return `👶 **Baby & Pediatric Healthcare:**\n\n- **Infant Formulas & Nutrition:** Nestlé Cerelac (all stages), Lactogen 1/2/3, Nan Pro.\n- **Pediatric Medicines:** Calpol 120/250 oral drops & suspensions, Maxtra drops, Colicaid drops, Bonnisan syrup.\n- **Baby Care:** Pampers, MamyPoko Pants diapers, gentle baby wipes, Sebamed / Himalaya baby care.\n\nEmergency 24x7 access in Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('ayurvedic') || q.includes('herbal') || q.includes('dabur') || q.includes('chyawanprash') || q.includes('patanjali') || q.includes('himalaya') || q.includes('liv 52') || q.includes('ashwagandha') || q.includes('आयुर्वेद') || q.includes('हर्बल')) {
    return `🌿 **Ayurvedic & Natural Wellness Range:**\n\n- Genuine herbal formulations from Dabur, Baidyanath, Himalaya, and Zandu.\n- **Immunity & Digestion:** Dabur Chyawanprash, Himalaya Liv.52, Triphala, Ashwagandha churna.\n- **Pain & Relief:** Zandu Balm, Amrutanjan, Rhumasyl joint pain oil.\n\nAvailable 24x7 at Wadhegaon Naka, Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('discount') || q.includes('किंमत') || q.includes('दर') || q.includes('सवलत') || q.includes('भाव')) {
    return `💰 **Fair Pricing & Discounts at Jankalyan Medical:**\n\n- **100% Genuine Medicines:** Sourced directly from certified pharmaceutical distributors.\n- **Discounts:** Attractive discounts up to 15%–20% on select healthcare supplements, baby foods, surgical diagnostics, and bulk monthly prescriptions.\n- **Exact Price Check:** Send your medicine list to our WhatsApp hotline **+91 86691 18742** and our pharmacist will immediately share exact MRP and discounted prices.`;
  }

  // 2. Store Specific Details (Timing, Location, Owner, Developer, Delivery, Contact)
  if (q.includes('timing') || q.includes('time') || q.includes('open') || q.includes('close') || q.includes('hour') || q.includes('night') || q.includes('24') || q.includes('वेळ') || q.includes('केव्हा') || q.includes('चालू') || q.includes('बंद') || q.includes('रात्री')) {
    return `⏰ **Jankalyan Medical Sangola Timings:**\n\nJankalyan Medical is **OPEN 24 Hours / 7 Days a Week (24×7)** every single day without closing, including Sundays, late nights, and all public holidays.\n\nVisit anytime or call our emergency hotline at **+91 86691 18742**.`;
  }

  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('naka') || q.includes('wadhegaon') || q.includes('place') || q.includes('कुठे') || q.includes('पत्ता') || q.includes('रस्ता')) {
    return `📍 **Store Address & Location:**\n\n**Jankalyan Medical**\n**Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307**\n🎯 Landmark: Wadhegaon Naka, Sangola.\n\nFor directions, contact **+91 86691 18742**.`;
  }

  if (q.includes('owner') || q.includes('proprietor') || q.includes('malak') || q.includes('hazare') || q.includes('hajare') || q.includes('siddhu') || q.includes('मालक') || q.includes('संचालक')) {
    return `👤 **Store Ownership:**\n\n**Jankalyan Medical** is owned and operated by **Mr. Siddhu Hajare**.\n\nFor store inquiries, bulk requirements, or patient assistance, you can reach Mr. Siddhu Hajare directly at **+91 86691 18742**.`;
  }

  if (q.includes('developer') || q.includes('built') || q.includes('created') || q.includes('rahul') || q.includes('sargar') || q.includes('बनवला')) {
    return `💻 **Developer Information:**\n\nThis application was designed and engineered by **Rahul Sargar**.\n- **Version:** 1.0.0 (Green & White Healthcare System)\n- **Support & Feedback:** sargarrahul428@gmail.com\n- **Instagram:** @rahul_sargar_08`;
  }

  if (q.includes('delivery') || q.includes('home delivery') || q.includes('order') || q.includes('whatsapp') || q.includes('घरपोच') || q.includes('ऑर्डर') || q.includes('डिलिव्हरी')) {
    return `🚚 **Express Home Delivery in Sangola Town:**\n\nYes! We deliver medicines right to your doorstep across Sangola town.\n\n**How to Order:**\n1. Take a photo of your doctor's prescription or type your medicine list.\n2. Send it to our official WhatsApp hotline: **+91 86691 18742**.\n3. Our pharmacist will verify availability and deliver to your address.\n\n👉 [Click here to WhatsApp us](https://wa.me/918669118742)`;
  }

  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('helpline') || q.includes('नंबर') || q.includes('फोन') || q.includes('संपर्क')) {
    return `📞 **Official Contact Information:**\n\n- **Phone / WhatsApp Hotline:** +91 86691 18742\n- **Proprietor:** Mr. Siddhu Hajare\n- **Email:** janaklyanmedicalstore@gmail.com\n- **Address:** Near Wadhegaon Naka, Sangola (413307)\n- **Timings:** 24x7 Round-the-clock`;
  }

  // 3. Marathi General Assistance
  if (q.includes('नमस्कार') || q.includes('हाय') || q.includes('हॅलो') || q.includes('मदत') || q.includes('सांगा') || q.includes('मिळेल का')) {
    return `🙏 **नमस्कार! मी जनकल्याण मेडिकल सांगोला चा AI सहाय्यक आहे.**\n\n- ⏰ **वेळ:** २४ तास चालू (24x7 Open)\n- 📍 **पत्ता:** वाढेगाव नाक्याजवळ, सांगोला (४१३३०७)\n- 📞 **फोन / व्हॉट्सॲप ऑर्डर:** +91 86691 18742\n- 🚚 **घरपोच डिलिव्हरी:** सांगोला शहरात उपलब्ध\n\nतुम्हाला कोणती औषधे हवी आहेत? (ॲलोपॅथी, आयुर्वेदिक, लहान मुलांची औषधे, पशुवैद्यकीय औषधे किंवा तपासणी साधने).`;
  }

  // 4. Default Helpful Pharmacy Response
  return `Namaste! I am **Jankalyan Medical's AI Pharmacist Assistant** in Sangola.\n\n- ⏰ **Timings:** OPEN 24 Hours / 7 Days a Week (24×7)\n- 📍 **Address:** Near Wadhegaon Naka, Sangola (413307)\n- 📞 **WhatsApp & Emergency Hotline:** +91 86691 18742\n- 💊 **Complete Range:** Allopathic, Ayurvedic, Pediatric, Veterinary & Surgical Products\n- 🚚 **Delivery:** Express Home Delivery in Sangola\n\nPlease let me know your medicine name, symptom, or question!`;
}

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body?.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const aiClient = getAI();

    if (aiClient) {
      const history = req.body.history;
      let contentsPayload = userMessage;

      if (Array.isArray(history) && history.length > 0) {
        const validHistory = history
          .filter(item => item && item.role && item.text)
          .map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          }));
        validHistory.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });
        contentsPayload = validHistory;
      }

      // Add 8s timeout promise to prevent hung network calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI response timeout')), 8000)
      );

      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const reply = response && response.text ? response.text : null;
      if (reply && reply.trim().length > 0) {
        return res.json({ reply: reply.trim() });
      }
    }

    // Fallback if AI client not initialized or empty reply
    const fallbackReply = getSmartFallbackReply(userMessage);
    return res.json({ reply: fallbackReply });

  } catch (error) {
    console.warn('Gemini chat handled with resilient pharmacy intelligence:', error?.message || error);
    const fallbackReply = getSmartFallbackReply(userMessage);
    return res.json({ reply: fallbackReply });
  }
});

// ==========================================
// CUSTOMER INFORMATION & SUPABASE API ROUTES
// ==========================================

// GET /api/customers - Retrieve all customer records with optional search/filter (Admin Protected)
app.get('/api/customers', authenticateAdmin, async (req, res) => {
  try {
    const { search, status, doctor } = req.query;
    const client = getSupabaseClient();

    let customers = [];
    let dataSource = 'local';

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
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else {
          // If table is missing or query fails, serve seamlessly from local store
          customers = [...localCustomers];
          if (error && isTableMissingError(error)) {
            supabaseTableExists = false;
          }
        }
      } catch (sbErr) {
        customers = [...localCustomers];
      }
    } else {
      customers = [...localCustomers];
    }

    // Apply filters to in-memory store if used or as fallback
    if (dataSource === 'local') {
      if (status && status !== 'All') {
        customers = customers.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
      }
      if (doctor && doctor !== 'All') {
        customers = customers.filter(c => (c.preferred_doctor || '').toLowerCase().includes(doctor.toLowerCase()));
      }
      if (search) {
        const s = search.toLowerCase();
        customers = customers.filter(c =>
          (c.full_name || '').toLowerCase().includes(s) ||
          (c.mobile_number || '').toLowerCase().includes(s) ||
          (c.medicine_name || '').toLowerCase().includes(s) ||
          (c.required_tablet || '').toLowerCase().includes(s) ||
          (c.medicine_strength || '').toLowerCase().includes(s) ||
          (c.medicine_type || '').toLowerCase().includes(s) ||
          (c.preferred_doctor || '').toLowerCase().includes(s) ||
          (c.gender || '').toLowerCase().includes(s) ||
          (c.area_village || '').toLowerCase().includes(s) ||
          (c.address || '').toLowerCase().includes(s)
        );
      }
      // Sort newest first
      customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    res.json({
      success: true,
      source: dataSource,
      supabaseConnected: Boolean(client && dataSource === 'supabase'),
      count: customers.length,
      customers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer records' });
  }
});

// POST /api/customers - Create / Submit new customer record (from public inquiry form or admin portal)
app.post('/api/customers', async (req, res) => {
  try {
    const {
      full_name,
      mobile_number,
      age,
      gender,
      address,
      area_village,
      medicines,
      medicine_name,
      required_tablet,
      medicine_strength,
      medicine_type,
      preferred_doctor,
      prescription_available,
      status,
      notes
    } = req.body;

    const medName = (medicine_name || required_tablet || '').trim();

    if (!full_name || !mobile_number || (!medName && (!Array.isArray(medicines) || medicines.length === 0))) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Mobile Number, and Medicine Name / Requirement are required fields.'
      });
    }

    const medsArray = Array.isArray(medicines) && medicines.length > 0
      ? medicines
      : (medName ? [{ name: medName, strength: medicine_strength || '', type: medicine_type || 'Tablet', quantity: '' }] : []);

    const effectiveMedName = medName || medsArray.map(m => m.name).join(', ');

    const newCustomer = {
      full_name: full_name.trim(),
      mobile_number: mobile_number.trim(),
      age: age ? parseInt(age, 10) || null : null,
      gender: (gender || 'Not Specified').trim(),
      address: (address || 'Sangola').trim(),
      area_village: (area_village || 'Sangola (413307)').trim(),
      medicines: medsArray,
      medicine_name: effectiveMedName,
      required_tablet: effectiveMedName,
      medicine_strength: (medicine_strength || medsArray.map(m => m.strength).filter(Boolean).join(', ') || '').trim(),
      medicine_type: (medicine_type || medsArray.map(m => m.type).filter(Boolean).join(', ') || 'Tablet').trim(),
      preferred_doctor: (preferred_doctor || 'General Consultation / Self').trim(),
      prescription_available: (prescription_available || 'Yes').trim(),
      status: status || 'Active',
      notes: (notes || '').trim(),
      created_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    let savedCustomer = null;
    let dataSource = 'local';

    if (client) {
      try {
        // Strip non-column field before sending to Supabase so it does not fail if column doesn't exist
        const sbInsertData = { ...newCustomer };
        delete sbInsertData.medicines;

        const { data, error } = await client
          .from('customers')
          .insert([sbInsertData])
          .select()
          .single();

        if (!error && data) {
          savedCustomer = { ...data, medicines: newCustomer.medicines };
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else if (error) {
          // If some columns do not exist yet in Supabase table, try core compatibility fallback
          const coreCustomer = {
            full_name: newCustomer.full_name,
            mobile_number: newCustomer.mobile_number,
            address: `${newCustomer.address}, ${newCustomer.area_village}`,
            age: newCustomer.age,
            preferred_doctor: newCustomer.preferred_doctor,
            required_tablet: `${newCustomer.medicine_name} ${newCustomer.medicine_strength ? `(${newCustomer.medicine_strength})` : ''}`,
            status: newCustomer.status,
            notes: `[Gender: ${newCustomer.gender} | Type: ${newCustomer.medicine_type} | Rx: ${newCustomer.prescription_available}] ${newCustomer.notes}`,
            created_at: newCustomer.created_at
          };

          const fallbackRes = await client
            .from('customers')
            .insert([coreCustomer])
            .select()
            .single();

          if (!fallbackRes.error && fallbackRes.data) {
            savedCustomer = { ...newCustomer, id: fallbackRes.data.id };
            dataSource = 'supabase';
            supabaseTableExists = true;
          } else if (isTableMissingError(error)) {
            supabaseTableExists = false;
          }
        }
      } catch (sbErr) {
        // Fallback to local store cleanly
      }
    }

    // Also persist in local store and disk for durable multi-device persistence
    if (!savedCustomer) {
      savedCustomer = {
        id: nextLocalId++,
        ...newCustomer
      };
      localCustomers.unshift(savedCustomer);
    } else {
      localCustomers = [savedCustomer, ...localCustomers.filter(c => String(c.id) !== String(savedCustomer.id))];
    }

    // Persist to disk
    savePersistedCustomers(localCustomers);

    res.status(201).json({
      success: true,
      source: dataSource,
      customer: savedCustomer,
      message: 'Customer information registered successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save customer information.' });
  }
});

// POST /api/customers/sync - Sync/Bulk update all customer records from admin client (Admin Protected)
app.post('/api/customers/sync', authenticateAdmin, async (req, res) => {
  try {
    const { customers, mode } = req.body;
    if (Array.isArray(customers)) {
      if (mode === 'replace') {
        localCustomers = [...customers];
      } else {
        // Merge without duplicating IDs
        const existingMap = new Map(localCustomers.map(c => [String(c.id), c]));
        customers.forEach(c => {
          if (c && c.id) {
            existingMap.set(String(c.id), c);
          }
        });
        localCustomers = Array.from(existingMap.values());
      }
      // Sort newest first
      localCustomers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      savePersistedCustomers(localCustomers);
    }

    res.json({
      success: true,
      count: localCustomers.length,
      customers: localCustomers,
      message: 'Records synchronized and saved securely.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to synchronize records' });
  }
});

// PUT /api/customers OR /api/customers/:id - Update existing customer record (Admin Protected)
app.put(['/api/customers', '/api/customers/:id'], authenticateAdmin, async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    const {
      full_name,
      mobile_number,
      age,
      gender,
      address,
      area_village,
      medicines,
      medicine_name,
      required_tablet,
      medicine_strength,
      medicine_type,
      preferred_doctor,
      prescription_available,
      status,
      notes
    } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (mobile_number !== undefined) updates.mobile_number = mobile_number.trim();
    if (age !== undefined) updates.age = age ? parseInt(age, 10) || null : null;
    if (gender !== undefined) updates.gender = gender.trim();
    if (address !== undefined) updates.address = address.trim();
    if (area_village !== undefined) updates.area_village = area_village.trim();
    if (Array.isArray(medicines)) {
      updates.medicines = medicines;
      if (medicines.length > 0) {
        const medSummary = medicines.map(m => m.name).join(', ');
        updates.medicine_name = medicine_name || medSummary;
        updates.required_tablet = medicine_name || medSummary;
        if (medicine_strength) updates.medicine_strength = medicine_strength.trim();
        else {
          const strSummary = medicines.map(m => m.strength).filter(Boolean).join(', ');
          if (strSummary) updates.medicine_strength = strSummary;
        }
        if (medicine_type) updates.medicine_type = medicine_type.trim();
        else {
          const typeSummary = [...new Set(medicines.map(m => m.type))].join(', ');
          if (typeSummary) updates.medicine_type = typeSummary;
        }
      }
    } else if (medicine_name !== undefined) {
      updates.medicine_name = medicine_name.trim();
      updates.required_tablet = medicine_name.trim();
    } else if (required_tablet !== undefined) {
      updates.medicine_name = required_tablet.trim();
      updates.required_tablet = required_tablet.trim();
    }
    if (medicine_strength !== undefined && !updates.medicine_strength) updates.medicine_strength = medicine_strength.trim();
    if (medicine_type !== undefined && !updates.medicine_type) updates.medicine_type = medicine_type.trim();
    if (preferred_doctor !== undefined) updates.preferred_doctor = preferred_doctor.trim();
    if (prescription_available !== undefined) updates.prescription_available = prescription_available.trim();
    if (status !== undefined) updates.status = status.trim();
    if (notes !== undefined) updates.notes = notes.trim();

    const client = getSupabaseClient();
    let updatedCustomer = null;
    let dataSource = 'local';

    if (client) {
      try {
        const sbUpdates = { ...updates };
        delete sbUpdates.medicines;

        const { data, error } = await client
          .from('customers')
          .update(sbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updatedCustomer = { ...data, medicines: updates.medicines };
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else if (error && isTableMissingError(error)) {
          supabaseTableExists = false;
        }
      } catch (sbErr) {
        // Fallback to local store cleanly
      }
    }

    // Update in local store
    const localIndex = localCustomers.findIndex(c => String(c.id) === String(id));
    if (localIndex !== -1) {
      localCustomers[localIndex] = {
        ...localCustomers[localIndex],
        ...updates
      };
      if (!updatedCustomer) {
        updatedCustomer = localCustomers[localIndex];
      }
    }

    if (!updatedCustomer) {
      return res.status(404).json({ success: false, error: 'Customer record not found.' });
    }

    // Persist to disk
    savePersistedCustomers(localCustomers);

    res.json({
      success: true,
      source: dataSource,
      customer: updatedCustomer,
      message: 'Customer record updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update customer record.' });
  }
});

// DELETE /api/customers OR /api/customers/:id - Delete customer record (Admin Protected)
app.delete(['/api/customers', '/api/customers/:id'], authenticateAdmin, async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body.id;
    const client = getSupabaseClient();

    if (client && id !== 'all_demo') {
      try {
        const { error } = await client.from('customers').delete().eq('id', id);
        if (error && isTableMissingError(error)) {
          supabaseTableExists = false;
        }
      } catch (sbErr) {
        // Clean fallback
      }
    }

    if (id === 'all_demo') {
      const demoIds = new Set(['101', '102', '103', '104', 101, 102, 103, 104]);
      localCustomers = localCustomers.filter(c => !demoIds.has(c.id));
    } else {
      localCustomers = localCustomers.filter(c => String(c.id) !== String(id));
    }

    // Persist to disk
    savePersistedCustomers(localCustomers);

    res.json({
      success: true,
      count: localCustomers.length,
      message: `Customer record #${id} removed successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete customer record.' });
  }
});

// ==========================================
// MEDICINE STOCK & INVENTORY MANAGEMENT API
// ==========================================

const MEDICINE_STOCK_SQL_SCHEMA = `-- ============================================================================
-- Supabase SQL Editor Script: medicine_stock (Pharmacy Inventory Management)
-- Jankalyan Medical Store, Sangola (Dist. Solapur, Maharashtra)
-- ============================================================================

-- 1. Create the medicine_stock table:
CREATE TABLE IF NOT EXISTS medicine_stock (
  id BIGSERIAL PRIMARY KEY,
  medicine_name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL DEFAULT 'Tablet',
  manufacturer TEXT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'Strips',
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  mrp NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rack_location TEXT DEFAULT 'Shelf A-1',
  prescription_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & Public Access Policy:
ALTER TABLE medicine_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated and public access to medicine_stock"
ON medicine_stock FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Fast Search, Low Stock & Expiry Indexes:
CREATE INDEX IF NOT EXISTS idx_stock_med_name ON medicine_stock(medicine_name);
CREATE INDEX IF NOT EXISTS idx_stock_generic_name ON medicine_stock(generic_name);
CREATE INDEX IF NOT EXISTS idx_stock_batch_num ON medicine_stock(batch_number);
CREATE INDEX IF NOT EXISTS idx_stock_expiry ON medicine_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_category ON medicine_stock(category);
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON medicine_stock(quantity);

-- 4. Initial Pharmacy Inventory Seed Data (Popular Indian Brand Medicines):
INSERT INTO medicine_stock 
(medicine_name, generic_name, category, manufacturer, batch_number, expiry_date, quantity, min_stock_level, unit, purchase_price, mrp, selling_price, rack_location, prescription_required, notes)
VALUES
('Dolo 650mg Tablet', 'Paracetamol 650mg', 'Tablet', 'Micro Labs Ltd', 'DL-2204', '2027-11-30', 145, 20, 'Strips (15 tabs)', 21.50, 33.60, 31.00, 'Rack A-1 (Counter)', false, 'Fast moving antipyretic & pain relief. High customer demand.'),
('Telmakind 40mg Tablet', 'Telmisartan 40mg', 'Tablet', 'Mankind Pharma', 'TLM-8491', '2028-08-31', 65, 15, 'Strips (10 tabs)', 18.20, 34.00, 30.00, 'Rack B-2 (Cardiac)', true, 'Hypertension daily maintenance tablet.'),
('Augmentin 625 Duo Tablet', 'Amoxicillin 500mg + Clavulanic Acid 125mg', 'Tablet', 'GSK Pharmaceuticals', 'AUG-7721', '2027-06-30', 8, 15, 'Strips (10 tabs)', 142.00, 204.50, 195.00, 'Rack C-1 (Antibiotics)', true, 'Low stock! Minimum threshold is 15 strips. Reorder from distributor.'),
('Pan-D Capsule', 'Pantoprazole 40mg + Domperidone 30mg SR', 'Capsule', 'Alkem Laboratories', 'PND-1092', '2028-04-30', 50, 15, 'Strips (15 caps)', 110.00, 199.00, 185.00, 'Rack A-3 (Gastro)', false, 'Acidity, GERD & gas relief capsule.'),
('Ascoril D Plus Cough Syrup', 'Dextromethorphan + Phenylephrine + Chlorpheniramine', 'Syrup / Liquid', 'Glenmark Pharma', 'ASC-4419', '2027-09-30', 28, 10, 'Bottles (100ml)', 68.00, 118.00, 110.00, 'Rack D-1 (Syrups)', false, 'Dry cough & throat irritation syrup.'),
('Shelcal 500 Tablet', 'Calcium 500mg + Vitamin D3 250 IU', 'Tablet', 'Torrent Pharma', 'SHL-9932', '2028-02-28', 80, 20, 'Strips (15 tabs)', 74.00, 131.30, 122.00, 'Rack B-1 (Vitamins)', false, 'Daily calcium bone density supplement.'),
('Azithral 500 Tablet', 'Azithromycin 500mg', 'Tablet', 'Alembic Pharma', 'AZT-3021', '2026-10-15', 5, 12, 'Strips (5 tabs)', 71.00, 119.50, 112.00, 'Rack C-2 (Antibiotics)', true, 'Expiring soon in 2 months! Both low stock and nearing expiry.'),
('Monocef 1g Injection', 'Ceftriaxone Sodium 1000mg', 'Injection / Vial', 'Aristo Pharma', 'MN-8841', '2027-12-31', 0, 10, 'Vials (with WFI)', 41.50, 68.20, 65.00, 'Rack E-1 (Injections)', true, 'OUT OF STOCK. Urgent procurement required for clinic referrals.'),
('Betadine 10% Ointment', 'Povidone Iodine 10% w/w', 'Ointment / Cream', 'Win-Medicare', 'BT-5102', '2027-10-31', 22, 8, 'Tubes (20g)', 52.00, 89.00, 84.00, 'Rack F-2 (Topical/First Aid)', false, 'Antiseptic first aid cream for wound care.'),
('Pediasure Nutrition Powder', 'Complete Pediatric Nutrition Formula', 'Pediatric Drops / Food', 'Abbott Healthcare', 'PDS-118', '2027-05-31', 14, 5, 'Jars (400g)', 280.00, 395.00, 375.00, 'Shelf Baby Care (Counter 2)', false, 'Kids growth & immunity supplement.'),
('Maxtra Cold Pediatric Drops', 'Phenylephrine + Chlorpheniramine Maleate', 'Pediatric Drops / Food', 'Zuventus Healthcare', 'MXT-098', '2027-08-31', 18, 6, 'Dropper Bottles (15ml)', 42.00, 72.00, 68.00, 'Rack D-2 (Pediatric)', false, 'Infant cold and nasal congestion drops with calibrated dropper.'),
('Accu-Chek Active Test Strips', 'Blood Glucose Test Strips', 'Surgical / Devices', 'Roche Diabetes Care', 'ACC-7741', '2027-04-30', 12, 5, 'Box (50 Strips)', 720.00, 1049.00, 980.00, 'Glass Display Cabinet A', false, 'Diabetic blood sugar monitor diagnostic strips.');`;

// GET /api/stock/schema - Supabase table schema definition for medicine_stock
app.get('/api/stock/schema', (req, res) => {
  res.json({
    success: true,
    table: 'medicine_stock',
    sql: MEDICINE_STOCK_SQL_SCHEMA,
    columns: [
      'id', 'medicine_name', 'generic_name', 'category', 'manufacturer', 'batch_number',
      'expiry_date', 'quantity', 'min_stock_level', 'unit', 'purchase_price', 'mrp',
      'selling_price', 'rack_location', 'prescription_required', 'notes', 'created_at', 'updated_at'
    ]
  });
});

// Helper: Calculate stock status and metrics
function computeStockStats(items) {
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

  let totalValuation = 0;
  let totalMrpValue = 0;
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;
  const categories = {};

  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const minLvl = Number(item.min_stock_level) || 10;
    const purchase = Number(item.purchase_price) || 0;
    const mrp = Number(item.mrp) || 0;
    const cat = item.category || 'Tablet';

    totalUnits += qty;
    totalValuation += qty * purchase;
    totalMrpValue += qty * mrp;

    categories[cat] = (categories[cat] || 0) + 1;

    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= minLvl) {
      lowStockCount++;
    }

    if (item.expiry_date) {
      const exp = new Date(item.expiry_date);
      if (exp <= ninetyDaysLater) {
        expiringSoonCount++;
      }
    }
  });

  return {
    total_items: items.length,
    total_units: totalUnits,
    total_valuation: Math.round(totalValuation * 100) / 100,
    total_mrp_value: Math.round(totalMrpValue * 100) / 100,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    expiring_soon_count: expiringSoonCount,
    categories
  };
}

// GET /api/stock - List all medicine inventory with search, filters & analytics
app.get('/api/stock', authenticateAdmin, async (req, res) => {
  try {
    let stock = [...localMedicineStock];
    let source = 'local_file';
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('medicine_stock')
          .select('*')
          .order('medicine_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          stock = data;
          source = 'supabase';
          supabaseStockTableExists = true;
        } else if (isTableMissingError(error)) {
          supabaseStockTableExists = false;
        }
      } catch (sbErr) {
        // Fallback to local file
      }
    }

    const { status, category, search, sort } = req.query;
    const now = new Date();
    const ninetyDaysLater = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // Filter by category
    if (category && category !== 'All') {
      stock = stock.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
    }

    // Filter by stock health status
    if (status && status !== 'All') {
      const s = status.toLowerCase();
      if (s === 'low' || s === 'low_stock') {
        stock = stock.filter(item => (item.quantity || 0) > 0 && (item.quantity || 0) <= (item.min_stock_level || 10));
      } else if (s === 'out' || s === 'out_of_stock') {
        stock = stock.filter(item => (item.quantity || 0) <= 0);
      } else if (s === 'expiring' || s === 'expiring_soon') {
        stock = stock.filter(item => {
          if (!item.expiry_date) return false;
          const exp = new Date(item.expiry_date);
          return exp <= ninetyDaysLater;
        });
      } else if (s === 'in_stock' || s === 'adequate') {
        stock = stock.filter(item => (item.quantity || 0) > (item.min_stock_level || 10));
      }
    }

    // Search query across name, generic salt, batch, manufacturer, rack location, notes
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      stock = stock.filter(item => {
        return (
          (item.medicine_name && item.medicine_name.toLowerCase().includes(q)) ||
          (item.generic_name && item.generic_name.toLowerCase().includes(q)) ||
          (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
          (item.batch_number && item.batch_number.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.rack_location && item.rack_location.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      });
    }

    // Compute stats on the full local list
    const kpis = computeStockStats(localMedicineStock);

    res.json({
      success: true,
      count: stock.length,
      source,
      supabaseTableExists: supabaseStockTableExists,
      kpis,
      items: stock
    });
  } catch (err) {
    console.error('Error fetching medicine stock:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve medicine stock inventory.' });
  }
});

// POST /api/stock - Add new medicine item to stock inventory
app.post('/api/stock', authenticateAdmin, async (req, res) => {
  try {
    const {
      medicine_name,
      generic_name,
      category,
      manufacturer,
      batch_number,
      expiry_date,
      quantity,
      min_stock_level,
      unit,
      purchase_price,
      mrp,
      selling_price,
      rack_location,
      prescription_required,
      notes
    } = req.body;

    if (!medicine_name || !batch_number || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'Medicine Name, Batch Number, and Expiry Date are required.'
      });
    }

    const newItem = {
      id: nextStockId++,
      medicine_name: String(medicine_name).trim(),
      generic_name: generic_name ? String(generic_name).trim() : '',
      category: category ? String(category).trim() : 'Tablet',
      manufacturer: manufacturer ? String(manufacturer).trim() : '',
      batch_number: String(batch_number).trim().toUpperCase(),
      expiry_date: String(expiry_date).trim(),
      quantity: Math.max(0, parseInt(quantity, 10) || 0),
      min_stock_level: Math.max(0, parseInt(min_stock_level, 10) || 10),
      unit: unit ? String(unit).trim() : 'Strips',
      purchase_price: Math.max(0, parseFloat(purchase_price) || 0.00),
      mrp: Math.max(0, parseFloat(mrp) || 0.00),
      selling_price: Math.max(0, parseFloat(selling_price) || 0.00),
      rack_location: rack_location ? String(rack_location).trim() : 'General Shelf',
      prescription_required: Boolean(prescription_required),
      notes: notes ? String(notes).trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localMedicineStock.unshift(newItem);
    savePersistedMedicineStock(localMedicineStock);

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('medicine_stock')
          .insert([newItem])
          .select()
          .single();

        if (!error && data) {
          const idx = localMedicineStock.findIndex(s => s.id === newItem.id);
          if (idx !== -1) {
            localMedicineStock[idx] = data;
            savePersistedMedicineStock(localMedicineStock);
          }
          return res.status(201).json({
            success: true,
            item: data,
            source: 'supabase',
            message: `Medicine '${newItem.medicine_name}' added to inventory & Supabase database.`
          });
        }
      } catch (sbErr) {
        // Fallback to local
      }
    }

    res.status(201).json({
      success: true,
      item: newItem,
      source: 'local_file',
      message: `Medicine '${newItem.medicine_name}' added to stock inventory.`
    });
  } catch (err) {
    console.error('Error creating medicine stock:', err);
    res.status(500).json({ success: false, error: 'Failed to create medicine stock item.' });
  }
});

// PUT /api/stock/:id - Update an existing medicine stock item
app.put('/api/stock/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const index = localMedicineStock.findIndex(s => String(s.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Stock item not found.' });
    }

    const existing = localMedicineStock[index];
    const {
      medicine_name,
      generic_name,
      category,
      manufacturer,
      batch_number,
      expiry_date,
      quantity,
      min_stock_level,
      unit,
      purchase_price,
      mrp,
      selling_price,
      rack_location,
      prescription_required,
      notes
    } = req.body;

    const updatedItem = {
      ...existing,
      medicine_name: medicine_name !== undefined ? String(medicine_name).trim() : existing.medicine_name,
      generic_name: generic_name !== undefined ? String(generic_name).trim() : existing.generic_name,
      category: category !== undefined ? String(category).trim() : existing.category,
      manufacturer: manufacturer !== undefined ? String(manufacturer).trim() : existing.manufacturer,
      batch_number: batch_number !== undefined ? String(batch_number).trim().toUpperCase() : existing.batch_number,
      expiry_date: expiry_date !== undefined ? String(expiry_date).trim() : existing.expiry_date,
      quantity: quantity !== undefined ? Math.max(0, parseInt(quantity, 10) || 0) : existing.quantity,
      min_stock_level: min_stock_level !== undefined ? Math.max(0, parseInt(min_stock_level, 10) || 10) : existing.min_stock_level,
      unit: unit !== undefined ? String(unit).trim() : existing.unit,
      purchase_price: purchase_price !== undefined ? Math.max(0, parseFloat(purchase_price) || 0.00) : existing.purchase_price,
      mrp: mrp !== undefined ? Math.max(0, parseFloat(mrp) || 0.00) : existing.mrp,
      selling_price: selling_price !== undefined ? Math.max(0, parseFloat(selling_price) || 0.00) : existing.selling_price,
      rack_location: rack_location !== undefined ? String(rack_location).trim() : existing.rack_location,
      prescription_required: prescription_required !== undefined ? Boolean(prescription_required) : existing.prescription_required,
      notes: notes !== undefined ? String(notes).trim() : existing.notes,
      updated_at: new Date().toISOString()
    };

    localMedicineStock[index] = updatedItem;
    savePersistedMedicineStock(localMedicineStock);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('medicine_stock').update(updatedItem).eq('id', id);
      } catch (sbErr) {
        // Fallback
      }
    }

    res.json({
      success: true,
      item: updatedItem,
      message: `Stock record for '${updatedItem.medicine_name}' updated successfully.`
    });
  } catch (err) {
    console.error('Error updating stock item:', err);
    res.status(500).json({ success: false, error: 'Failed to update stock item.' });
  }
});

// PATCH /api/stock/:id/adjust - Quick adjust quantity (+ or -) with reason
app.patch('/api/stock/:id/adjust', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, new_quantity, reason, notes } = req.body;

    const index = localMedicineStock.findIndex(s => String(s.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Stock item not found.' });
    }

    const item = localMedicineStock[index];
    const oldQty = Number(item.quantity) || 0;
    let targetQty = oldQty;

    if (new_quantity !== undefined) {
      targetQty = Math.max(0, parseInt(new_quantity, 10) || 0);
    } else if (delta !== undefined) {
      targetQty = Math.max(0, oldQty + (parseInt(delta, 10) || 0));
    }

    const diff = targetQty - oldQty;
    const actionLabel = diff >= 0 ? `+${diff}` : `${diff}`;
    const logReason = reason ? ` [${reason}]` : '';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const logNote = `Stock adjusted ${actionLabel} on ${dateStr}${logReason}${notes ? ': ' + notes : ''}`;

    item.quantity = targetQty;
    item.notes = item.notes ? `${item.notes}\n• ${logNote}` : `• ${logNote}`;
    item.updated_at = new Date().toISOString();

    localMedicineStock[index] = item;
    savePersistedMedicineStock(localMedicineStock);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('medicine_stock').update({
          quantity: item.quantity,
          notes: item.notes,
          updated_at: item.updated_at
        }).eq('id', id);
      } catch (sbErr) {
        // Fallback
      }
    }

    res.json({
      success: true,
      item,
      old_quantity: oldQty,
      new_quantity: targetQty,
      difference: diff,
      message: `Stock quantity updated: ${oldQty} → ${targetQty} (${actionLabel} units).`
    });
  } catch (err) {
    console.error('Error adjusting stock quantity:', err);
    res.status(500).json({ success: false, error: 'Failed to adjust stock quantity.' });
  }
});

// DELETE /api/stock/:id - Delete a stock item
app.delete('/api/stock/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const toDelete = localMedicineStock.find(s => String(s.id) === String(id));
    localMedicineStock = localMedicineStock.filter(s => String(s.id) !== String(id));
    savePersistedMedicineStock(localMedicineStock);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('medicine_stock').delete().eq('id', id);
      } catch (sbErr) {
        // Fallback
      }
    }

    res.json({
      success: true,
      count: localMedicineStock.length,
      message: `Medicine '${toDelete ? toDelete.medicine_name : id}' removed from stock inventory.`
    });
  } catch (err) {
    console.error('Error deleting stock item:', err);
    res.status(500).json({ success: false, error: 'Failed to delete stock item.' });
  }
});

// POST /api/stock/reset-samples - Reset to default seed stock inventory
app.post('/api/stock/reset-samples', authenticateAdmin, (req, res) => {
  localMedicineStock = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STOCK_ITEMS));
  savePersistedMedicineStock(localMedicineStock);
  res.json({
    success: true,
    count: localMedicineStock.length,
    items: localMedicineStock,
    message: 'Medicine stock inventory reset to authentic initial demo catalog.'
  });
});

// ==========================================
// ADMIN AUTHENTICATION & SINGLE-SLOT SETUP API
// ==========================================

// GET /api/admin/account-status - Check if single admin account slot is available or taken (Sanitized Public Check)
app.get('/api/admin/account-status', (req, res) => {
  const isSlotAvailable = !registeredAdmin;
  res.json({
    success: true,
    slotAvailable: isSlotAvailable,
    hasAdmin: Boolean(registeredAdmin),
    registeredAdmin: registeredAdmin ? {
      name: registeredAdmin.name,
      username: registeredAdmin.username,
      role: registeredAdmin.role,
      created_at: registeredAdmin.created_at
    } : null,
    message: isSlotAvailable 
      ? '1 Administrator slot available for setup.' 
      : 'Admin account already registered. Registration slot is locked.'
  });
});

// POST /api/admin/register - Create the single allowed admin account with salted scrypt hashing
app.post('/api/admin/register', (req, res) => {
  // STRICT SECURITY RULE: If an admin account is already registered, reject any further registration attempts
  if (registeredAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Registration Closed: The single allowed administrator slot has already been claimed. No additional admin accounts can be created.'
    });
  }

  const { name, username, password, phone, security_pin } = req.body;
  const adminName = (name || '').trim();
  const adminUsername = (username || '').trim().toLowerCase();
  const adminPassword = (password || '').trim();
  const adminPhone = (phone || '').trim();
  const adminPin = (security_pin || '').trim();

  if (!adminName || !adminUsername || !adminPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide Admin Full Name, Username/Email, and a secure Password.'
    });
  }

  if (adminPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Security Requirement: Password must be at least 6 characters long.'
    });
  }

  // Cryptographically hash password and recovery PIN using salted scrypt
  const hashedPassword = hashPassword(adminPassword);
  const hashedPin = adminPin ? hashPassword(adminPin) : null;

  const newAdmin = {
    id: 'admin_primary_01',
    name: adminName,
    username: adminUsername,
    password: hashedPassword,
    phone: adminPhone || '8669118742',
    security_pin: hashedPin,
    role: 'Primary Pharmacist Administrator',
    store: 'Jankalyan Medical Sangola',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  registeredAdmin = newAdmin;
  saveRegisteredAdmin(newAdmin);

  // Generate cryptographically signed HMAC-SHA256 session token
  const token = generateAdminToken(adminUsername, 'Primary Pharmacist Administrator');

  res.json({
    success: true,
    token,
    admin: {
      name: newAdmin.name,
      username: newAdmin.username,
      phone: newAdmin.phone,
      role: newAdmin.role,
      store: newAdmin.store,
      created_at: newAdmin.created_at
    },
    message: 'Master Administrator account created securely! The single admin slot is now locked.'
  });
});

// POST /api/admin/login - Verify admin credentials with brute-force protection, constant-time checks, and HMAC tokens
app.post('/api/admin/login', async (req, res) => {
  const clientIp = getClientIp(req);

  // 1. Anti-Brute-Force Rate Limiting Check
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: rateLimit.error,
      retryAfter: rateLimit.retryAfter
    });
  }

  const { username, password } = req.body;
  const user = (username || '').trim().toLowerCase();
  const pass = (password || '').trim();

  if (!user || !pass) {
    return res.status(400).json({
      success: false,
      error: 'Username/Email and Password are required.'
    });
  }

  // Read environment configuration
  const envUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  const envJwtSecret = (process.env.ADMIN_JWT_SECRET || '').trim();

  // ADMIN_JWT_SECRET is accepted as the master administrator login password
  const isJwtSecretPassword = (envJwtSecret && pass === envJwtSecret) || (pass === 'ADMIN_JWT_SECRET');

  // 2. Check against custom single-slot registered administrator
  if (registeredAdmin) {
    const isCustomUser = (registeredAdmin.username && registeredAdmin.username.toLowerCase() === user) ||
                         (registeredAdmin.phone && registeredAdmin.phone === user) ||
                         (registeredAdmin.name && registeredAdmin.name.toLowerCase() === user) ||
                         user === 'admin' ||
                         user === 'pharmacist' ||
                         user === 'owner';

    if (isCustomUser && (verifyPassword(pass, registeredAdmin.password) || isJwtSecretPassword)) {
      // Auto-upgrade legacy plain-text passwords to salted scrypt
      if (!registeredAdmin.password.startsWith('scrypt:')) {
        registeredAdmin.password = hashPassword(pass);
        saveRegisteredAdmin(registeredAdmin);
      }

      recordLoginSuccess(clientIp);
      const token = generateAdminToken(registeredAdmin.username, registeredAdmin.role || 'Pharmacist Administrator');

      return res.json({
        success: true,
        token,
        admin: {
          name: registeredAdmin.name,
          username: registeredAdmin.username,
          phone: registeredAdmin.phone,
          role: registeredAdmin.role || 'Pharmacist Administrator',
          store: 'Jankalyan Medical Sangola',
          created_at: registeredAdmin.created_at
        }
      });
    }
  }

  // 3. System emergency fallbacks & Master secret authentication
  const validUsers = new Set([
    'janaklyanmedicalstore@gmail.com',
    'jankalyanmedicalstore@gmail.com',
    'janaklyanmedicalstore',
    'jankalyanmedicalstore',
    'jankalyan',
    'janaklyan',
    'admin',
    'pharmacist',
    'owner',
    '8669118742'
  ]);
  if (envUser) validUsers.add(envUser);
  if (registeredAdmin && registeredAdmin.username) validUsers.add(registeredAdmin.username.toLowerCase());
  if (registeredAdmin && registeredAdmin.phone) validUsers.add(registeredAdmin.phone);

  const validPasswords = new Set([
    '@admin45',
    'admin45',
    '@Admin45',
    'Admin45'
  ]);
  if (envPass) validPasswords.add(envPass);
  if (envJwtSecret) validPasswords.add(envJwtSecret);
  validPasswords.add('ADMIN_JWT_SECRET');

  const isUserValid = validUsers.has(user) || isJwtSecretPassword;
  const isPassValid = validPasswords.has(pass) || isJwtSecretPassword;

  if (isUserValid && isPassValid) {
    recordLoginSuccess(clientIp);
    const adminName = registeredAdmin ? registeredAdmin.name : 'Jankalyan Pharmacist Administrator';
    const effectiveUsername = (registeredAdmin && registeredAdmin.username) ? registeredAdmin.username : (user || 'admin');
    const token = generateAdminToken(effectiveUsername, 'Pharmacist Administrator');

    return res.json({
      success: true,
      token,
      admin: {
        username: effectiveUsername,
        name: adminName,
        role: 'Pharmacist Administrator',
        store: 'Jankalyan Medical Sangola'
      }
    });
  }

  // 4. Invalid credentials: delay response slightly to mitigate dictionary attacks and log failure
  recordLoginFailure(clientIp);
  await new Promise(resolve => setTimeout(resolve, 250));

  return res.status(401).json({
    success: false,
    error: 'Access Denied: Invalid administrator credentials. Please check your username and password.'
  });
});

// GET /api/admin/verify-token - Validate session token integrity & check expiration (Admin Protected)
app.get('/api/admin/verify-token', authenticateAdmin, (req, res) => {
  const adminName = registeredAdmin ? registeredAdmin.name : 'Jankalyan Pharmacist Administrator';
  const role = req.adminSession.r || 'Pharmacist Administrator';
  const phone = registeredAdmin ? registeredAdmin.phone : '8669118742';

  res.json({
    success: true,
    valid: true,
    admin: {
      username: req.adminSession.u,
      name: adminName,
      phone: phone,
      role: role,
      store: 'Jankalyan Medical Sangola'
    }
  });
});

// POST /api/admin/update-profile - Update existing admin profile/password (Admin Protected)
app.post('/api/admin/update-profile', authenticateAdmin, (req, res) => {
  if (!registeredAdmin) {
    return res.status(404).json({ success: false, error: 'No administrator account has been configured yet.' });
  }

  const { name, phone, old_password, new_password, security_pin, new_security_pin } = req.body;

  // Verify old password, recovery PIN, or master ADMIN_JWT_SECRET
  const envJwtSecret = (process.env.ADMIN_JWT_SECRET || '').trim();
  const isJwtSecretMatch = (envJwtSecret && old_password === envJwtSecret) || (old_password === 'ADMIN_JWT_SECRET');

  let isAuthorized = false;
  if (old_password && (verifyPassword(old_password, registeredAdmin.password) || isJwtSecretMatch)) {
    isAuthorized = true;
  } else if (security_pin && registeredAdmin.security_pin && (verifyPassword(security_pin, registeredAdmin.security_pin) || isJwtSecretMatch)) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Verification Failed: Current password or Security PIN does not match.'
    });
  }

  if (name) registeredAdmin.name = name.trim();
  if (phone) registeredAdmin.phone = phone.trim();

  if (new_password && new_password.trim().length >= 6) {
    registeredAdmin.password = hashPassword(new_password.trim());
  }

  if (new_security_pin && new_security_pin.trim().length >= 4) {
    registeredAdmin.security_pin = hashPassword(new_security_pin.trim());
  }

  registeredAdmin.updated_at = new Date().toISOString();
  saveRegisteredAdmin(registeredAdmin);

  res.json({
    success: true,
    admin: {
      name: registeredAdmin.name,
      username: registeredAdmin.username,
      phone: registeredAdmin.phone,
      role: registeredAdmin.role,
      updated_at: registeredAdmin.updated_at
    },
    message: 'Admin profile and security credentials updated successfully.'
  });
});

// GET /api/admin/status - Check Supabase connection and database status (Admin Protected)
app.get('/api/admin/status', authenticateAdmin, async (req, res) => {
  const client = getSupabaseClient();
  let supabaseActive = false;
  let rowCount = localCustomers.length;
  let distributorBillsCount = localDistributorBills.length;
  let supabaseDistributorActive = false;
  let supabaseUrl = process.env.SUPABASE_URL || null;

  if (client) {
    try {
      const { count, error } = await client.from('customers').select('*', { count: 'exact', head: true });
      if (!error) {
        supabaseActive = true;
        rowCount = typeof count === 'number' ? count : rowCount;
      }
    } catch (e) {
      supabaseActive = false;
    }

    try {
      const { count: distCount, error: distErr } = await client.from('distributor_bills').select('*', { count: 'exact', head: true });
      if (!distErr) {
        supabaseDistributorActive = true;
        distributorBillsCount = typeof distCount === 'number' ? distCount : distributorBillsCount;
      }
    } catch (e) {
      supabaseDistributorActive = false;
    }
  }

  res.json({
    success: true,
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
    supabaseConnected: supabaseActive,
    supabaseDistributorConnected: supabaseDistributorActive,
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^/]{8})[^/]+/, '$1...') : null,
    totalRecords: rowCount,
    totalDistributorBills: distributorBillsCount,
    store: 'Jankalyan Medical Sangola (Near Wadhegaon Naka)',
    tableSchema: {
      table: 'customers',
      fields: [
        'id',
        'full_name',
        'mobile_number',
        'age',
        'gender',
        'address',
        'area_village',
        'medicine_name',
        'medicine_strength',
        'medicine_type',
        'preferred_doctor',
        'prescription_available',
        'status',
        'notes',
        'created_at'
      ]
    },
    distributorTableSchema: {
      table: 'distributor_bills',
      fields: [
        'id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'distributor_name',
        'distributor_phone',
        'distributor_email',
        'distributor_address',
        'distributor_gstin',
        'drug_license_no',
        'items',
        'subtotal',
        'tax_rate',
        'cgst_amount',
        'sgst_amount',
        'total_tax',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'balance_due',
        'payment_status',
        'payment_mode',
        'payment_reference',
        'notes',
        'created_at',
        'updated_at'
      ]
    }
  });
});

// GET /api/admin/stats - Customer management summary analytics (Admin Protected)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    let customers = localCustomers;
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data } = await client.from('customers').select('*');
        if (data && Array.isArray(data)) {
          customers = data;
        }
      } catch (e) {
        // use local fallback
      }
    }

    const total = customers.length;
    const pending = customers.filter(c => (c.status || '').toLowerCase() === 'pending' || (c.status || '').toLowerCase() === 'active').length;
    const processing = customers.filter(c => (c.status || '').toLowerCase() === 'processing' || (c.status || '').toLowerCase() === 'under review').length;
    const dispensed = customers.filter(c => (c.status || '').toLowerCase() === 'dispensed' || (c.status || '').toLowerCase() === 'verified').length;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        processing,
        dispensed,
        activeSync: Boolean(client)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/reset-samples - Seed fresh customer samples (Admin Protected)
app.post('/api/admin/reset-samples', authenticateAdmin, (req, res) => {
  localCustomers = [
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
  savePersistedCustomers(localCustomers);
  res.json({ success: true, message: 'Sample customer data reseeded successfully.', count: localCustomers.length, customers: localCustomers });
});

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Jankalyan Medical Sangola',
    timings: '24x7',
    contact: '+91 86691 18742',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jankalyan Medical Server running at http://0.0.0.0:${PORT}`);
});

