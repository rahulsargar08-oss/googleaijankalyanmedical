/* ==========================================================================
   18. MEDICINE STOCK MANAGEMENT & PHARMACY INVENTORY
   Supabase Database & Admin Master Control Integration
   Tracks Live Medicine Stock, Batches, Expiry Dates, Shelf Racks & Pricing
   ========================================================================== */

let allStockItems = [];
let currentStockStatusFilter = 'All';
let currentStockCategoryFilter = 'All';
let stockSearchQuery = '';
let pendingDeleteStockId = null;
const STOCK_STORAGE_KEY = 'jankalyan_medicine_stock';

// Initial medicine stock demo items
const INITIAL_STOCK_SAMPLE_ITEMS = [
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
        notes: 'Fast-moving antipyretic & pain relief. High seasonal demand in Sangola.'
    },
    {
        id: 2,
        medicine_name: 'Telmakind 40mg Tablet',
        generic_name: 'Telmisartan 40mg IP',
        category: 'Tablet',
        manufacturer: 'Mankind Pharma',
        batch_number: 'TLM-8491',
        expiry_date: '2028-08-31',
        quantity: 12,
        min_stock_level: 25,
        unit: 'Strips (10 tabs)',
        purchase_price: 26.00,
        mrp: 42.50,
        selling_price: 39.00,
        rack_location: 'Rack B-3 (Cardiac)',
        prescription_required: true,
        notes: 'Essential blood pressure maintenance medicine for elderly patients.'
    },
    {
        id: 3,
        medicine_name: 'Pan-D Capsules',
        generic_name: 'Pantoprazole 40mg + Domperidone 30mg SR',
        category: 'Capsule',
        manufacturer: 'Alkem Laboratories',
        batch_number: 'PND-1092',
        expiry_date: '2028-04-30',
        quantity: 0,
        min_stock_level: 15,
        unit: 'Strips (15 caps)',
        purchase_price: 125.00,
        mrp: 199.00,
        selling_price: 185.00,
        rack_location: 'Rack C-1 (Gastro)',
        prescription_required: false,
        notes: 'Out of stock! Urgently reorder 20 boxes via Alkem Pandharpur supplier.'
    },
    {
        id: 4,
        medicine_name: 'Azee 500 Tablets',
        generic_name: 'Azithromycin 500mg IP',
        category: 'Tablet',
        manufacturer: 'Cipla Ltd',
        batch_number: 'AZ-9021',
        expiry_date: '2028-03-31',
        quantity: 65,
        min_stock_level: 15,
        unit: 'Strips (3 tabs)',
        purchase_price: 85.00,
        mrp: 132.00,
        selling_price: 124.00,
        rack_location: 'Rack A-4 (Antibiotics)',
        prescription_required: true,
        notes: 'Broad-spectrum antibiotic. Keep in dry place below 25°C.'
    },
    {
        id: 5,
        medicine_name: 'Ascoril-D Cough Syrup',
        generic_name: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
        category: 'Syrup / Liquid',
        manufacturer: 'Glenmark Pharma',
        batch_number: 'ASC-883',
        expiry_date: '2026-10-15',
        quantity: 8,
        min_stock_level: 15,
        unit: 'Bottles (100ml)',
        purchase_price: 88.00,
        mrp: 138.00,
        selling_price: 128.00,
        rack_location: 'Rack S-2 (Syrups)',
        prescription_required: false,
        notes: 'Expiring soon in Oct 2026! Return or dispense priority.'
    },
    {
        id: 6,
        medicine_name: 'Augmentin 625 Duo Tablets',
        generic_name: 'Amoxycillin 500mg + Potassium Clavulanate 125mg',
        category: 'Tablet',
        manufacturer: 'GSK Pharmaceuticals',
        batch_number: 'AUG-441',
        expiry_date: '2027-09-30',
        quantity: 40,
        min_stock_level: 10,
        unit: 'Strips (10 tabs)',
        purchase_price: 148.00,
        mrp: 223.00,
        selling_price: 208.00,
        rack_location: 'Rack B-1 (Antibiotics)',
        prescription_required: true,
        notes: 'Moisture-sensitive blister packing. Schedule H1 Rx strictly required.'
    },
    {
        id: 7,
        medicine_name: 'Volini Pain Relief Gel',
        generic_name: 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate',
        category: 'Ointment / Cream',
        manufacturer: 'Sun Pharma',
        batch_number: 'VL-410',
        expiry_date: '2028-10-31',
        quantity: 28,
        min_stock_level: 10,
        unit: 'Tubes (75g)',
        purchase_price: 145.00,
        mrp: 210.00,
        selling_price: 195.00,
        rack_location: 'Rack D-2 (Topicals)',
        prescription_required: false,
        notes: 'Fast-acting topical analgesic gel for joint & muscle pain.'
    },
    {
        id: 8,
        medicine_name: 'Gemcal 500mg Softgels',
        generic_name: 'Calcium Carbonate 500mg + Calcitriol 0.25mcg + Zinc 7.5mg',
        category: 'Capsule',
        manufacturer: 'Alkem Laboratories',
        batch_number: 'GMC-182',
        expiry_date: '2028-05-31',
        quantity: 5,
        min_stock_level: 15,
        unit: 'Strips (15 softgels)',
        purchase_price: 180.00,
        mrp: 285.00,
        selling_price: 265.00,
        rack_location: 'Rack C-2 (Supplements)',
        prescription_required: false,
        notes: 'Low stock! High regular demand for orthopaedic prescriptions.'
    },
    {
        id: 9,
        medicine_name: 'Betadine 10% Ointment',
        generic_name: 'Povidone-Iodine 10% w/w',
        category: 'Ointment / Cream',
        manufacturer: 'Win-Medicare Ltd',
        batch_number: 'BT-991',
        expiry_date: '2028-02-28',
        quantity: 35,
        min_stock_level: 10,
        unit: 'Tubes (20g)',
        purchase_price: 75.00,
        mrp: 115.00,
        selling_price: 108.00,
        rack_location: 'Rack D-1 (Antiseptics)',
        prescription_required: false,
        notes: 'Standard first aid antiseptic ointment.'
    },
    {
        id: 10,
        medicine_name: 'Corex-DX Cough Syrup',
        generic_name: 'Dextromethorphan HBr 10mg + Chlorpheniramine Maleate 2mg',
        category: 'Syrup / Liquid',
        manufacturer: 'Pfizer Ltd',
        batch_number: 'CDX-301',
        expiry_date: '2027-12-31',
        quantity: 0,
        min_stock_level: 12,
        unit: 'Bottles (100ml)',
        purchase_price: 96.00,
        mrp: 145.00,
        selling_price: 135.00,
        rack_location: 'Rack S-1 (Syrups)',
        prescription_required: true,
        notes: 'Out of stock. Inquire with Pandharpur supplier.'
    }
];

// Helper: Calculate days until medicine expiry date
function getDaysUntilExpiry(expiryDateStr) {
    if (!expiryDateStr) return 999;
    const expiry = new Date(expiryDateStr);
    if (isNaN(expiry.getTime())) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Determine stock health classification
function getStockHealthStatus(item) {
    const qty = Number(item.quantity) || 0;
    const minLevel = Number(item.min_stock_level) || 10;
    const daysToExpiry = getDaysUntilExpiry(item.expiry_date);

    if (qty <= 0) return 'out_of_stock';
    if (daysToExpiry <= 90) return 'expiring_soon';
    if (qty <= minLevel) return 'low_stock';
    return 'in_stock';
}

// Load Medicine Stock Records from Server API / Supabase with Local Cache Fallback
async function loadStockRecords(forceRefresh = false) {
    const tableBody = document.getElementById('stockTableBody');
    const loadingState = document.getElementById('stockLoadingSpinner');
    const emptyState = document.getElementById('stockEmptyState');
    const refreshIcon = document.getElementById('stockRefreshIcon');

    if (refreshIcon) refreshIcon.classList.add('fa-spin');
    if (loadingState && (!allStockItems || allStockItems.length === 0 || forceRefresh)) {
        loadingState.style.display = 'flex';
    }

    // 1. Initial local cache check
    if (!allStockItems.length && !forceRefresh) {
        try {
            const cached = localStorage.getItem(STOCK_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allStockItems = parsed;
                    renderStockTable();
                    updateStockKpiStats();
                }
            }
        } catch (e) {}
    }

    // 2. Fetch fresh stock from backend server
    try {
        const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/stock', { headers });
        if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.items)) {
                allStockItems = data.items;
                try {
                    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
                } catch (e) {}
                renderStockTable();
                updateStockKpiStats(data.kpis);
                if (forceRefresh) showToast('Medicine stock inventory synchronized successfully.');
                return;
            }
        }
    } catch (err) {
        console.warn('Backend stock fetch failed, using local/sample cache:', err);
    } finally {
        if (loadingState) loadingState.style.display = 'none';
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }

    // 3. Fallback to sample items if empty
    if (!allStockItems || allStockItems.length === 0) {
        allStockItems = JSON.parse(JSON.stringify(INITIAL_STOCK_SAMPLE_ITEMS));
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}
    }

    renderStockTable();
    updateStockKpiStats();
}

// Render Medicine Stock Table Rows
function renderStockTable() {
    const tableBody = document.getElementById('stockTableBody');
    const emptyState = document.getElementById('stockEmptyState');
    const tableWrapper = document.getElementById('stockTableWrapper');

    if (!tableBody) return;

    // Filter items according to active filters and search query
    let filtered = [...allStockItems];

    // Status filter
    if (currentStockStatusFilter !== 'All') {
        filtered = filtered.filter(item => {
            const health = getStockHealthStatus(item);
            return health === currentStockStatusFilter;
        });
    }

    // Category filter
    if (currentStockCategoryFilter !== 'All') {
        filtered = filtered.filter(item => (item.category || '').toLowerCase() === currentStockCategoryFilter.toLowerCase());
    }

    // Search query
    if (stockSearchQuery.trim()) {
        const q = stockSearchQuery.trim().toLowerCase();
        filtered = filtered.filter(item => {
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

    // Show/hide empty state
    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableWrapper) tableWrapper.style.display = 'block';

    tableBody.innerHTML = filtered.map(item => {
        const qty = Number(item.quantity) || 0;
        const minLevel = Number(item.min_stock_level) || 10;
        const daysToExpiry = getDaysUntilExpiry(item.expiry_date);
        const health = getStockHealthStatus(item);

        // Expiry text formatting
        let expiryBadgeHtml = '';
        if (daysToExpiry < 0) {
            expiryBadgeHtml = `<span class="stock-badge-tag expired"><i class="fa-solid fa-triangle-exclamation"></i> EXPIRED (${Math.abs(daysToExpiry)}d ago)</span>`;
        } else if (daysToExpiry <= 90) {
            expiryBadgeHtml = `<span class="stock-badge-tag expiring"><i class="fa-solid fa-hourglass-half"></i> Expiring in ${daysToExpiry} days</span>`;
        } else {
            const expYears = (daysToExpiry / 365).toFixed(1);
            expiryBadgeHtml = `<span class="stock-badge-tag safe"><i class="fa-solid fa-circle-check"></i> ${expYears} yrs left</span>`;
        }

        // Qty styling
        let qtyColor = '#059669';
        let qtyBg = '#ecfdf5';
        let qtyBorder = '#a7f3d0';
        if (qty <= 0) {
            qtyColor = '#dc2626';
            qtyBg = '#fef2f2';
            qtyBorder = '#fca5a5';
        } else if (qty <= minLevel) {
            qtyColor = '#d97706';
            qtyBg = '#fffbeb';
            qtyBorder = '#fde68a';
        }

        // Health pill
        let healthPillHtml = '';
        if (health === 'out_of_stock') {
            healthPillHtml = `<span class="stock-health-pill out"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
        } else if (health === 'low_stock') {
            healthPillHtml = `<span class="stock-health-pill low"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock (${qty})</span>`;
        } else if (health === 'expiring_soon') {
            healthPillHtml = `<span class="stock-health-pill expiring"><i class="fa-solid fa-hourglass-half"></i> Expiring Soon</span>`;
        } else {
            healthPillHtml = `<span class="stock-health-pill ok"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;
        }

        const purchaseRate = Number(item.purchase_price) || 0;
        const mrpRate = Number(item.mrp) || 0;
        const sellRate = Number(item.selling_price) || 0;

        return `
            <tr data-stock-id="${item.id}" class="stock-row ${health === 'out_of_stock' ? 'row-out-of-stock' : ''}">
                <!-- Medicine & Composition -->
                <td>
                    <div class="stock-med-cell">
                        <div class="stock-med-name-wrap">
                            <strong class="stock-med-title">${escapeHtml(item.medicine_name || 'Unnamed')}</strong>
                            ${item.prescription_required ? '<span class="rx-pill-badge" title="Schedule H/H1 Doctor Prescription Required"><i class="fa-solid fa-prescription"></i> Rx</span>' : ''}
                        </div>
                        ${item.generic_name ? `<span class="stock-generic-sub"><i class="fa-solid fa-flask-vial"></i> ${escapeHtml(item.generic_name)}</span>` : ''}
                        ${item.notes ? `<small class="stock-notes-sub" title="${escapeHtml(item.notes)}"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(item.notes.slice(0, 50))}${item.notes.length > 50 ? '...' : ''}</small>` : ''}
                    </div>
                </td>

                <!-- Category & Manufacturer -->
                <td>
                    <div class="stock-mfr-cell">
                        <span class="stock-category-chip"><i class="fa-solid fa-tag"></i> ${escapeHtml(item.category || 'Tablet')}</span>
                        <span class="stock-mfr-name">${escapeHtml(item.manufacturer || 'Standard Pharma')}</span>
                    </div>
                </td>

                <!-- Batch No. & Expiry -->
                <td>
                    <div class="stock-batch-cell">
                        <span class="stock-batch-code">${escapeHtml(item.batch_number || 'N/A')}</span>
                        <div class="stock-expiry-line">
                            <span class="stock-expiry-date">${item.expiry_date || 'N/A'}</span>
                            ${expiryBadgeHtml}
                        </div>
                    </div>
                </td>

                <!-- In-Stock Qty -->
                <td>
                    <div class="stock-qty-cell">
                        <div class="stock-qty-badge" style="background: ${qtyBg}; color: ${qtyColor}; border: 1.5px solid ${qtyBorder};">
                            <span class="qty-num">${qty}</span>
                            <span class="qty-unit">${escapeHtml(item.unit || 'Units')}</span>
                        </div>
                    </div>
                </td>

                <!-- Min Reorder Level -->
                <td>
                    <div class="stock-min-cell">
                        <span class="min-level-text">${minLevel} ${escapeHtml(item.unit || 'Units')}</span>
                        ${qty <= minLevel ? '<small style="color: #ea580c; font-weight: 600; display: block; font-size: 0.74rem;">⚠️ Reorder Required</small>' : '<small style="color: #64748b; display: block; font-size: 0.74rem;">Shelf Threshold</small>'}
                    </div>
                </td>

                <!-- Pricing (₹) -->
                <td>
                    <div class="stock-price-cell">
                        <div class="price-row"><span class="price-lbl">Cost:</span> <span class="price-val">₹${purchaseRate.toFixed(2)}</span></div>
                        <div class="price-row"><span class="price-lbl">MRP:</span> <span class="price-val mrp-val">₹${mrpRate.toFixed(2)}</span></div>
                        <div class="price-row"><span class="price-lbl">Sell:</span> <strong class="price-val sell-val" style="color: #059669;">₹${sellRate.toFixed(2)}</strong></div>
                    </div>
                </td>

                <!-- Rack / Shelf Location -->
                <td>
                    <div class="stock-rack-cell">
                        <span class="rack-badge"><i class="fa-solid fa-map-pin"></i> ${escapeHtml(item.rack_location || 'General Shelf')}</span>
                    </div>
                </td>

                <!-- Stock Health Status -->
                <td>
                    ${healthPillHtml}
                </td>

                <!-- Actions -->
                <td class="text-right">
                    <div class="stock-actions-group">
                        <button type="button" class="btn-stock-action btn-adjust" onclick="openStockAdjustModal(${item.id})" title="Quick Stock Adjustment (+/- Units)">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Adjust</span>
                        </button>
                        <button type="button" class="btn-stock-action btn-edit" onclick="openEditStockModal(${item.id})" title="Edit Medicine Stock Details">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-stock-action btn-delete" onclick="openDeleteStockModal(${item.id})" title="Delete Medicine Stock Item">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update KPI Stats Cards and Filter Counts
function updateStockKpiStats(serverKpis) {
    const totalItems = allStockItems.length;
    let totalQty = 0;
    let totalValuation = 0;
    let lowCount = 0;
    let outCount = 0;
    let expiringCount = 0;
    let adequateCount = 0;

    allStockItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const minLevel = Number(item.min_stock_level) || 10;
        const daysToExpiry = getDaysUntilExpiry(item.expiry_date);
        const cost = Number(item.purchase_price) || 0;

        totalQty += qty;
        totalValuation += qty * cost;

        if (qty <= 0) {
            outCount++;
        } else if (daysToExpiry <= 90) {
            expiringCount++;
        } else if (qty <= minLevel) {
            lowCount++;
        } else {
            adequateCount++;
        }
    });

    // Update KPI Card UI elements
    const kpiTotalEl = document.getElementById('kpiStockTotalItems');
    const kpiValuationEl = document.getElementById('kpiStockValuation');
    const kpiLowEl = document.getElementById('kpiStockLowCount');
    const kpiOutEl = document.getElementById('kpiStockOutCount');
    const kpiExpiringEl = document.getElementById('kpiStockExpiringCount');
    const tabStockBadge = document.getElementById('tabStockCount');

    if (kpiTotalEl) kpiTotalEl.textContent = totalItems;
    if (kpiValuationEl) kpiValuationEl.textContent = `₹${Math.round(totalValuation).toLocaleString('en-IN')} Total Valuation • ${totalQty} Units`;
    if (kpiLowEl) kpiLowEl.textContent = lowCount;
    if (kpiOutEl) kpiOutEl.textContent = outCount;
    if (kpiExpiringEl) kpiExpiringEl.textContent = expiringCount;
    if (tabStockBadge) tabStockBadge.textContent = totalItems;

    // Update filter counts
    const countAll = document.getElementById('stockCountAll');
    const countAdequate = document.getElementById('stockCountAdequate');
    const countLow = document.getElementById('stockCountLow');
    const countOut = document.getElementById('stockCountOut');
    const countExpiring = document.getElementById('stockCountExpiring');

    if (countAll) countAll.textContent = totalItems;
    if (countAdequate) countAdequate.textContent = adequateCount;
    if (countLow) countLow.textContent = lowCount;
    if (countOut) countOut.textContent = outCount;
    if (countExpiring) countExpiring.textContent = expiringCount;
}

// Open Add Stock Modal
function openAddStockModal() {
    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    const form = document.getElementById('medicineStockForm');

    if (form) form.reset();

    const titleEl = document.getElementById('stockCrudModalTitle');
    const saveBtnText = document.getElementById('saveStockBtnText');
    const idEl = document.getElementById('stockCrudItemId');

    if (titleEl) titleEl.textContent = 'Add Medicine Stock';
    if (saveBtnText) saveBtnText.textContent = 'Save Medicine Stock';
    if (idEl) idEl.value = '';

    // Set sensible defaults
    const categoryEl = document.getElementById('stockCategory');
    const qtyEl = document.getElementById('stockQuantity');
    const minLevelEl = document.getElementById('stockMinLevel');
    const unitEl = document.getElementById('stockUnit');
    const rackEl = document.getElementById('stockRackLocation');
    const expEl = document.getElementById('stockExpiryDate');

    if (categoryEl) categoryEl.value = 'Tablet';
    if (qtyEl) qtyEl.value = '20';
    if (minLevelEl) minLevelEl.value = '10';
    if (unitEl) unitEl.value = 'Strips (10 tabs)';
    if (rackEl) rackEl.value = 'Rack A-1';

    // Default expiry date: 2 years ahead
    if (expEl) {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 2);
        expEl.value = future.toISOString().slice(0, 10);
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

// Open Edit Stock Modal
function openEditStockModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock item not found.');
        return;
    }

    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    const titleEl = document.getElementById('stockCrudModalTitle');
    const saveBtnText = document.getElementById('saveStockBtnText');

    if (titleEl) titleEl.textContent = `Edit Medicine Stock: ${item.medicine_name}`;
    if (saveBtnText) saveBtnText.textContent = 'Update Stock Item';

    // Populate form fields
    const idEl = document.getElementById('stockCrudItemId');
    const nameEl = document.getElementById('stockMedicineName');
    const genericEl = document.getElementById('stockGenericName');
    const categoryEl = document.getElementById('stockCategory');
    const mfrEl = document.getElementById('stockManufacturer');
    const batchEl = document.getElementById('stockBatchNumber');
    const expiryEl = document.getElementById('stockExpiryDate');
    const qtyEl = document.getElementById('stockQuantity');
    const minEl = document.getElementById('stockMinLevel');
    const unitEl = document.getElementById('stockUnit');
    const rackEl = document.getElementById('stockRackLocation');
    const purchaseEl = document.getElementById('stockPurchasePrice');
    const mrpEl = document.getElementById('stockMrp');
    const sellingEl = document.getElementById('stockSellingPrice');
    const rxEl = document.getElementById('stockRxRequired');
    const notesEl = document.getElementById('stockNotes');

    if (idEl) idEl.value = item.id;
    if (nameEl) nameEl.value = item.medicine_name || '';
    if (genericEl) genericEl.value = item.generic_name || '';
    if (categoryEl) categoryEl.value = item.category || 'Tablet';
    if (mfrEl) mfrEl.value = item.manufacturer || '';
    if (batchEl) batchEl.value = item.batch_number || '';
    if (expiryEl) expiryEl.value = item.expiry_date || '';
    if (qtyEl) qtyEl.value = item.quantity !== undefined ? item.quantity : 0;
    if (minEl) minEl.value = item.min_stock_level !== undefined ? item.min_stock_level : 10;
    if (unitEl) unitEl.value = item.unit || 'Strips';
    if (rackEl) rackEl.value = item.rack_location || '';
    if (purchaseEl) purchaseEl.value = item.purchase_price !== undefined ? item.purchase_price : 0;
    if (mrpEl) mrpEl.value = item.mrp !== undefined ? item.mrp : 0;
    if (sellingEl) sellingEl.value = item.selling_price !== undefined ? item.selling_price : 0;
    if (rxEl) rxEl.checked = Boolean(item.prescription_required);
    if (notesEl) notesEl.value = item.notes || '';

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

// Close Add/Edit Stock Modal
function closeStockModal() {
    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

// Handle Add/Edit Stock Form Submit
async function handleStockFormSubmit(event) {
    if (event) event.preventDefault();

    const idEl = document.getElementById('stockCrudItemId');
    const isEdit = idEl && idEl.value.trim().length > 0;
    const itemId = isEdit ? idEl.value.trim() : null;

    const medicineName = (document.getElementById('stockMedicineName')?.value || '').trim();
    const genericName = (document.getElementById('stockGenericName')?.value || '').trim();
    const category = (document.getElementById('stockCategory')?.value || 'Tablet').trim();
    const manufacturer = (document.getElementById('stockManufacturer')?.value || '').trim();
    const batchNumber = (document.getElementById('stockBatchNumber')?.value || '').trim().toUpperCase();
    const expiryDate = (document.getElementById('stockExpiryDate')?.value || '').trim();
    const quantity = parseInt(document.getElementById('stockQuantity')?.value, 10) || 0;
    const minLevel = parseInt(document.getElementById('stockMinLevel')?.value, 10) || 10;
    const unit = (document.getElementById('stockUnit')?.value || 'Strips').trim();
    const rackLocation = (document.getElementById('stockRackLocation')?.value || 'Rack A-1').trim();
    const purchasePrice = parseFloat(document.getElementById('stockPurchasePrice')?.value) || 0;
    const mrp = parseFloat(document.getElementById('stockMrp')?.value) || 0;
    const sellingPrice = parseFloat(document.getElementById('stockSellingPrice')?.value) || 0;
    const rxRequired = Boolean(document.getElementById('stockRxRequired')?.checked);
    const notes = (document.getElementById('stockNotes')?.value || '').trim();

    if (!medicineName) {
        showToast('Please enter the Medicine / Brand Name.');
        return;
    }
    if (!batchNumber) {
        showToast('Please enter a Batch Number.');
        return;
    }
    if (!expiryDate) {
        showToast('Please specify the Expiry Date.');
        return;
    }

    const payload = {
        medicine_name: medicineName,
        generic_name: genericName,
        category,
        manufacturer,
        batch_number: batchNumber,
        expiry_date: expiryDate,
        quantity,
        min_stock_level: minLevel,
        unit,
        rack_location: rackLocation,
        purchase_price: purchasePrice,
        mrp,
        selling_price: sellingPrice,
        prescription_required: rxRequired,
        notes
    };

    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveBtn = document.getElementById('saveStockBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        if (isEdit) {
            // Update existing stock item
            await fetch(`/api/stock/${itemId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            }).catch(() => null);

            const index = allStockItems.findIndex(s => String(s.id) === String(itemId));
            if (index !== -1) {
                allStockItems[index] = { ...allStockItems[index], ...payload, updated_at: new Date().toISOString() };
            }
            showToast(`Medicine '${medicineName}' updated in stock.`);
        } else {
            // Add new stock item
            let res = await fetch('/api/stock', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            }).catch(() => null);

            let createdItem = null;
            if (res && res.ok) {
                const data = await res.json();
                if (data && data.item) createdItem = data.item;
            }

            if (!createdItem) {
                const maxId = allStockItems.reduce((max, s) => Math.max(max, typeof s.id === 'number' ? s.id : parseInt(s.id, 10) || 0), 0);
                createdItem = {
                    ...payload,
                    id: maxId + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }

            allStockItems.unshift(createdItem);
            showToast(`Medicine '${medicineName}' added to stock inventory.`);
        }

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeStockModal();
        renderStockTable();
        updateStockKpiStats();
    } catch (err) {
        console.error('Error saving stock record:', err);
        showToast('Error saving medicine stock record.');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Quick Preset: Fill Manufacturer
function quickFillStockManufacturer(name) {
    const input = document.getElementById('stockManufacturer');
    if (input) input.value = name;
}

// Quick Stock Adjustment (+ / -) Modal
function openStockAdjustModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock record not found.');
        return;
    }

    const modal = document.getElementById('stock-adjust-modal');
    const backdrop = document.getElementById('stock-adjust-backdrop');

    const idEl = document.getElementById('adjustStockId');
    const nameEl = document.getElementById('adjustMedName');
    const batchEl = document.getElementById('adjustMedBatch');
    const curQtyEl = document.getElementById('adjustMedCurrentQty');
    const unitEl = document.getElementById('adjustMedUnit');
    const deltaEl = document.getElementById('adjustDelta');
    const reasonEl = document.getElementById('adjustReason');
    const notesEl = document.getElementById('adjustNotes');

    if (idEl) idEl.value = item.id;
    if (nameEl) nameEl.textContent = item.medicine_name || 'Medicine';
    if (batchEl) batchEl.textContent = item.batch_number || '-';
    if (curQtyEl) curQtyEl.textContent = item.quantity || 0;
    if (unitEl) unitEl.textContent = item.unit || 'Units';
    if (deltaEl) deltaEl.value = '10';
    if (reasonEl) reasonEl.value = 'Fresh Inward Supply';
    if (notesEl) notesEl.value = '';

    updateAdjustPreview();

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeStockAdjustModal() {
    const modal = document.getElementById('stock-adjust-modal');
    const backdrop = document.getElementById('stock-adjust-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function handleAdjustReasonChange() {
    const reasonEl = document.getElementById('adjustReason');
    const deltaEl = document.getElementById('adjustDelta');
    if (!reasonEl || !deltaEl) return;

    const reason = reasonEl.value;
    if (reason === 'Fresh Inward Supply') {
        deltaEl.value = '10';
    } else if (reason === 'Counter Dispensed / Patient Sale') {
        deltaEl.value = '-1';
    } else if (reason === 'Damaged / Broken in Transit') {
        deltaEl.value = '-1';
    } else if (reason === 'Batch Expiry Return') {
        deltaEl.value = '-10';
    } else if (reason === 'Physical Inventory Audit Correction') {
        deltaEl.value = '0';
    }
    updateAdjustPreview();
}

function updateAdjustPreview() {
    const idEl = document.getElementById('adjustStockId');
    const deltaEl = document.getElementById('adjustDelta');
    const displayEl = document.getElementById('adjustResultingDisplay');
    if (!idEl || !deltaEl || !displayEl) return;

    const item = allStockItems.find(s => String(s.id) === String(idEl.value));
    const curQty = item ? Number(item.quantity) || 0 : 0;
    const delta = parseInt(deltaEl.value, 10) || 0;
    const resulting = Math.max(0, curQty + delta);
    const unit = item ? item.unit || 'Units' : 'Units';

    displayEl.textContent = `${resulting} ${unit}`;
    if (resulting === 0) {
        displayEl.style.color = '#dc2626';
        displayEl.style.borderColor = '#fca5a5';
        displayEl.style.background = '#fef2f2';
    } else if (resulting < (item?.min_stock_level || 10)) {
        displayEl.style.color = '#d97706';
        displayEl.style.borderColor = '#fde68a';
        displayEl.style.background = '#fffbeb';
    } else {
        displayEl.style.color = '#059669';
        displayEl.style.borderColor = '#a7f3d0';
        displayEl.style.background = '#ecfdf5';
    }
}

async function handleStockAdjustSubmit(event) {
    if (event) event.preventDefault();

    const idEl = document.getElementById('adjustStockId');
    const deltaEl = document.getElementById('adjustDelta');
    const reasonEl = document.getElementById('adjustReason');
    const notesEl = document.getElementById('adjustNotes');

    if (!idEl || !idEl.value) return;

    const itemId = idEl.value;
    const delta = parseInt(deltaEl?.value, 10) || 0;
    const reason = (reasonEl?.value || 'Stock Adjustment').trim();
    const notes = (notesEl?.value || '').trim();

    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveBtn = document.getElementById('saveAdjustBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        await fetch(`/api/stock/${itemId}/adjust`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ delta, reason, notes })
        }).catch(() => null);

        const index = allStockItems.findIndex(s => String(s.id) === String(itemId));
        if (index !== -1) {
            const oldQty = Number(allStockItems[index].quantity) || 0;
            const newQty = Math.max(0, oldQty + delta);
            const actionLabel = delta >= 0 ? `+${delta}` : `${delta}`;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const logNote = `Stock adjusted ${actionLabel} on ${dateStr} [${reason}]${notes ? ': ' + notes : ''}`;

            allStockItems[index].quantity = newQty;
            allStockItems[index].notes = allStockItems[index].notes ? `${allStockItems[index].notes}\n• ${logNote}` : `• ${logNote}`;
            allStockItems[index].updated_at = new Date().toISOString();
        }

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeStockAdjustModal();
        renderStockTable();
        updateStockKpiStats();
        showToast(`Stock updated: ${delta >= 0 ? '+' : ''}${delta} units applied.`);
    } catch (err) {
        console.error('Error adjusting stock:', err);
        showToast('Error applying stock adjustment.');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Delete Medicine Stock Modal
function openDeleteStockModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock item not found.');
        return;
    }

    pendingDeleteStockId = id;
    const modal = document.getElementById('stock-delete-modal');
    const backdrop = document.getElementById('stock-delete-backdrop');
    const previewBox = document.getElementById('stockDeleteTargetPreview');

    if (previewBox) {
        previewBox.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <h4 style="color: #991b1b; font-size: 1.05rem; font-weight: 700; margin: 0 0 4px 0;">${escapeHtml(item.medicine_name || 'Unnamed')}</h4>
                <div style="font-size: 0.82rem; color: #b91c1c; display: flex; gap: 14px; flex-wrap: wrap;">
                    <span><strong>Category:</strong> ${escapeHtml(item.category || 'Tablet')}</span>
                    <span><strong>Batch:</strong> ${escapeHtml(item.batch_number || '-')}</span>
                    <span><strong>Current Stock:</strong> ${item.quantity || 0} ${escapeHtml(item.unit || 'Units')}</span>
                    <span><strong>Shelf:</strong> ${escapeHtml(item.rack_location || '-')}</span>
                </div>
            </div>
        `;
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeDeleteStockModal() {
    pendingDeleteStockId = null;
    const modal = document.getElementById('stock-delete-modal');
    const backdrop = document.getElementById('stock-delete-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

async function confirmDeleteStockItem() {
    if (!pendingDeleteStockId) return;

    const itemId = pendingDeleteStockId;
    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const delBtn = document.getElementById('confirmStockDeleteBtn');
    if (delBtn) delBtn.disabled = true;

    try {
        await fetch(`/api/stock/${itemId}`, {
            method: 'DELETE',
            headers
        }).catch(() => null);

        const targetMed = allStockItems.find(s => String(s.id) === String(itemId));
        allStockItems = allStockItems.filter(s => String(s.id) !== String(itemId));

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeDeleteStockModal();
        renderStockTable();
        updateStockKpiStats();
        showToast(`'${targetMed ? targetMed.medicine_name : 'Medicine'}' removed from stock inventory.`);
    } catch (err) {
        console.error('Error deleting stock item:', err);
        showToast('Error deleting medicine stock item.');
    } finally {
        if (delBtn) delBtn.disabled = false;
    }
}

// Search & Filter Handlers
function handleStockSearch() {
    const input = document.getElementById('stockSearchInput');
    const clearBtn = document.getElementById('stockSearchClearBtn');
    if (!input) return;

    stockSearchQuery = input.value;
    if (clearBtn) clearBtn.style.display = stockSearchQuery.length > 0 ? 'block' : 'none';
    renderStockTable();
}

function clearStockSearch() {
    const input = document.getElementById('stockSearchInput');
    const clearBtn = document.getElementById('stockSearchClearBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    stockSearchQuery = '';
    renderStockTable();
}

function filterStockByStatus(status) {
    currentStockStatusFilter = status;
    const container = document.getElementById('stockStatusFilterPills');
    if (container) {
        const pills = container.querySelectorAll('.filter-pill');
        pills.forEach(p => {
            p.classList.remove('active');
            if (p.getAttribute('onclick')?.includes(`'${status}'`)) {
                p.classList.add('active');
            }
        });
    }
    renderStockTable();
}

function filterStockByCategory(category) {
    currentStockCategoryFilter = category;
    renderStockTable();
}

// Export Medicine Stock to CSV
function exportStockCSV() {
    if (!allStockItems || allStockItems.length === 0) {
        showToast('No medicine stock records to export.');
        return;
    }

    const headers = [
        'Medicine Name',
        'Generic Salt Formula',
        'Dosage Category',
        'Manufacturer',
        'Batch Number',
        'Expiry Date',
        'Stock Quantity',
        'Packaging Unit',
        'Min Reorder Alert Level',
        'Purchase Cost (INR)',
        'Printed MRP (INR)',
        'Selling Counter Price (INR)',
        'Shelf Rack Location',
        'Schedule Rx Required',
        'Stock Health Status',
        'Inventory Notes'
    ];

    const rows = allStockItems.map(item => {
        const health = getStockHealthStatus(item);
        return [
            `"${(item.medicine_name || '').replace(/"/g, '""')}"`,
            `"${(item.generic_name || '').replace(/"/g, '""')}"`,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
            `"${(item.batch_number || '').replace(/"/g, '""')}"`,
            `"${item.expiry_date || ''}"`,
            `"${item.quantity || 0}"`,
            `"${(item.unit || '').replace(/"/g, '""')}"`,
            `"${item.min_stock_level || 10}"`,
            `"${item.purchase_price || 0}"`,
            `"${item.mrp || 0}"`,
            `"${item.selling_price || 0}"`,
            `"${(item.rack_location || '').replace(/"/g, '""')}"`,
            `"${item.prescription_required ? 'Yes (Rx Required)' : 'No (OTC)'}"`,
            `"${health}"`,
            `"${(item.notes || '').replace(/"/g, '""')}"`
        ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jankalyan_medicine_stock_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print Stock Report
function printStockReport() {
    window.print();
}

// Reset sample stock items
async function resetSampleStock() {
    try {
        const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/stock/reset-samples', {
            method: 'POST',
            headers
        }).catch(() => null);

        allStockItems = JSON.parse(JSON.stringify(INITIAL_STOCK_SAMPLE_ITEMS));
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        renderStockTable();
        updateStockKpiStats();
        showToast('Medicine stock inventory reset to authentic demo catalog.');
    } catch (e) {
        showToast('Reset sample medicine stock completed.');
    }
}

// Expose all stock functions on window for inline HTML onclick/onchange/onsubmit handlers
if (typeof window !== 'undefined') {
    window.loadStockRecords = loadStockRecords;
    window.renderStockTable = renderStockTable;
    window.updateStockKpiStats = updateStockKpiStats;
    window.openAddStockModal = openAddStockModal;
    window.openEditStockModal = openEditStockModal;
    window.closeStockModal = closeStockModal;
    window.handleStockFormSubmit = handleStockFormSubmit;
    window.quickFillStockManufacturer = quickFillStockManufacturer;
    window.openStockAdjustModal = openStockAdjustModal;
    window.closeStockAdjustModal = closeStockAdjustModal;
    window.handleAdjustReasonChange = handleAdjustReasonChange;
    window.updateAdjustPreview = updateAdjustPreview;
    window.handleStockAdjustSubmit = handleStockAdjustSubmit;
    window.openDeleteStockModal = openDeleteStockModal;
    window.closeDeleteStockModal = closeDeleteStockModal;
    window.confirmDeleteStockItem = confirmDeleteStockItem;
    window.handleStockSearch = handleStockSearch;
    window.clearStockSearch = clearStockSearch;
    window.filterStockByStatus = filterStockByStatus;
    window.filterStockByCategory = filterStockByCategory;
    window.exportStockCSV = exportStockCSV;
    window.printStockReport = printStockReport;
    window.resetSampleStock = resetSampleStock;
}
