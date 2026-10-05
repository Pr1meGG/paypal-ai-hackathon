/**
 * ScopeGuard Front-End Application Controller
 * PayPal AI Hackathon - Automated Scope Diffing & Orders v2 Integration
 */

// State Management
const state = {
  currentProject: null,
  currentScopeAnalysis: null,
  currentOrder: null,
  activePreset: 'included',
  activeChannel: 'slack',
  auditHistory: [
    {
      id: "sc_init_001",
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projectName: "FinTech MVP Alpha",
      channel: "slack",
      classification: "INCLUDED",
      price: 0,
      status: "INCLUDED",
      orderId: "-",
      explanation: "Footer copyright date update is covered under contract maintenance clause 4.1."
    },
    {
      id: "sc_init_002",
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projectName: "HealthTech Patient Portal",
      channel: "email",
      classification: "EXTRA_PROPOSED",
      price: 650,
      status: "PAID",
      orderId: "8XY78412LK90321A",
      explanation: "Automated SMS notification pipeline was not in agreed SOW."
    }
  ]
};

// Scenario Presets Data
const PRESETS = {
  included: {
    name: "E-Commerce Checkout Redesign",
    merchant: "freelancer@scopeguard.dev",
    channel: "slack",
    sow: `SCOPE OF WORK (SOW) - CONTRACT #SG-2026-004:
1. Deliver responsive checkout UI supporting desktop and mobile viewports.
2. Standard form validation for billing and shipping addresses.
3. Bug fixes and CSS style adjustments for 30 days post-launch.
4. Integrate basic cart summary and order confirmation screen.`,
    request: `Hey! On mobile safari the checkout 'Complete Order' button is getting cut off slightly by the browser bar, and there is a typo in the shipping state dropdown. Could you adjust that styling?`,
    expectedClass: 'INCLUDED',
    suggestedPrice: 0.00
  },
  extra: {
    name: "SaaS Dashboard v1.2",
    merchant: "agency@scopeguard.dev",
    channel: "slack",
    sow: `SCOPE OF WORK (SOW) - CONTRACT #SG-2026-009:
1. React frontend with user authentication (Email/Password).
2. PostgreSQL database schema for personal user profiles.
3. Standard CSV export of user profile data.
4. Excludes third-party payments, webhooks, analytics charts, and recurring billing.`,
    request: `We really love the prototype! We'd like to quickly add a PayPal and Stripe subscription checkout modal with automated tiered billing and a monthly ARR analytics graph before launch next week.`,
    expectedClass: 'EXTRA_PROPOSED',
    suggestedPrice: 500.00
  },
  major: {
    name: "Enterprise Fleet Logistics",
    merchant: "enterprise-lead@scopeguard.dev",
    channel: "teams",
    sow: `SCOPE OF WORK (SOW) - CONTRACT #SG-2026-015:
1. Single-tenant internal driver tracking app.
2. Basic REST API endpoints for dispatch status updates.
3. Standard username/password login.
4. Strictly limited to single company domain without RBAC or multi-tenancy.`,
    request: `Our enterprise client demands Okta SAML 2.0 SSO integration, multi-tenant workspace isolation with 5 granular role-based access control (RBAC) tiers, and automated audit logging exports. Can you deliver this by Friday?`,
    expectedClass: 'EXTRA_PROPOSED',
    suggestedPrice: 1850.00
  }
};

// DOM Elements
const elements = {
  // Inputs
  projectName: document.getElementById('projectName'),
  merchantEmail: document.getElementById('merchantEmail'),
  contractSow: document.getElementById('contractSow'),
  clientRequest: document.getElementById('clientRequest'),
  btnAnalyze: document.getElementById('btnAnalyze'),
  
  // Commercial inputs
  proposedPrice: document.getElementById('proposedPrice'),
  merchantNotes: document.getElementById('merchantNotes'),
  btnApproveOrder: document.getElementById('btnApproveOrder'),
  
  // Panes
  analysisBadge: document.getElementById('analysisBadge'),
  emptyState: document.getElementById('emptyState'),
  aiResultCard: document.getElementById('aiResultCard'),
  classificationBanner: document.getElementById('classificationBanner'),
  classificationIcon: document.getElementById('classificationIcon'),
  classificationTitle: document.getElementById('classificationTitle'),
  classificationSubtitle: document.getElementById('classificationSubtitle'),
  confidenceScore: document.getElementById('confidenceScore'),
  explanationText: document.getElementById('explanationText'),
  sowEvidenceText: document.getElementById('sowEvidenceText'),
  itemizedDeliverables: document.getElementById('itemizedDeliverables'),
  
  // Callouts & PayPal
  includedCallout: document.getElementById('includedCallout'),
  paypalActionCard: document.getElementById('paypalActionCard'),
  orderStatusBox: document.getElementById('orderStatusBox'),
  orderIdCode: document.getElementById('orderIdCode'),
  idempotencyKey: document.getElementById('idempotencyKey'),
  orderStatusPill: document.getElementById('orderStatusPill'),
  approveUrlLink: document.getElementById('approveUrlLink'),
  captureSection: document.getElementById('captureSection'),
  btnCapturePayment: document.getElementById('btnCapturePayment'),
  captureSuccessBox: document.getElementById('captureSuccessBox'),
  captureIdCode: document.getElementById('captureIdCode'),
  payerEmailCode: document.getElementById('payerEmailCode'),
  
  // Metrics
  kpiTotalScans: document.getElementById('kpiTotalScans'),
  kpiCreepPrevented: document.getElementById('kpiCreepPrevented'),
  kpiExtraProposed: document.getElementById('kpiExtraProposed'),
  kpiCaptureRate: document.getElementById('kpiCaptureRate'),
  
  // Audit Table & Search
  auditSearchInput: document.getElementById('auditSearchInput'),
  auditTableBody: document.getElementById('auditTableBody'),
  
  // Modal & Toasts
  auditModal: document.getElementById('auditModal'),
  modalJson: document.getElementById('modalJson'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// Initialization & Event Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadPreset('included');
  renderAuditTable();
  updateKPIMetrics();

  // Keyboard shortcuts (1, 2, 3 for presets)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '1') loadPreset('included');
    if (e.key === '2') loadPreset('extra');
    if (e.key === '3') loadPreset('major');
  });

  // Search input filter
  if (elements.auditSearchInput) {
    elements.auditSearchInput.addEventListener('input', (e) => {
      renderAuditTable(e.target.value.trim().toLowerCase());
    });
  }
});

// Toast notification helper
function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Channel Selector
function selectChannel(channel) {
  state.activeChannel = channel;
  document.querySelectorAll('.channel-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.channel === channel);
  });
}

// Load Scenario Preset
function loadPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;

  state.activePreset = presetKey;
  
  // Update UI Pills
  document.querySelectorAll('.preset-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.getElementById(`pillScenario${presetKey === 'included' ? 1 : presetKey === 'extra' ? 2 : 3}`);
  if (activePill) activePill.classList.add('active');

  // Fill Inputs
  elements.projectName.value = preset.name;
  elements.merchantEmail.value = preset.merchant;
  elements.contractSow.value = preset.sow;
  elements.clientRequest.value = preset.request;
  selectChannel(preset.channel);

  // Reset Output State
  resetOutputPane();
  showToast(`Loaded ${preset.name} preset`, 'info');
}

function resetOutputPane() {
  state.currentProject = null;
  state.currentScopeAnalysis = null;
  state.currentOrder = null;

  elements.emptyState.classList.remove('hidden');
  elements.aiResultCard.classList.add('hidden');
  elements.includedCallout.classList.add('hidden');
  elements.paypalActionCard.classList.add('hidden');
  elements.orderStatusBox.classList.add('hidden');
  elements.captureSection.classList.add('hidden');
  elements.captureSuccessBox.classList.add('hidden');

  elements.analysisBadge.className = 'status-badge status-idle';
  elements.analysisBadge.textContent = 'Awaiting Input';
}

// ==========================================================================
// Step 1: Semantic AI Scope Analysis
// ==========================================================================
async function runScopeAnalysis() {
  const projectName = elements.projectName.value.trim();
  const merchantEmail = elements.merchantEmail.value.trim();
  const contractSow = elements.contractSow.value.trim();
  const clientRequest = elements.clientRequest.value.trim();

  if (!projectName || !merchantEmail || !contractSow || !clientRequest) {
    showToast('Please provide Project Name, Merchant Email, SOW, and Client Message.', 'warning');
    return;
  }

  // Set Loading State
  elements.btnAnalyze.disabled = true;
  elements.btnAnalyze.innerHTML = `<div class="btn-spinner"></div> Analyzing Scope Brief...`;

  try {
    // 1. Create or register project
    const projectRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: projectName,
        client_name: "Client Organization",
        client_email: merchantEmail,
        original_brief: contractSow
      })
    });

    if (!projectRes.ok) throw new Error('Failed to create project record.');
    state.currentProject = await projectRes.json();

    // 2. Perform AI Scope Diff
    const analyzeRes = await fetch(`/api/scope/projects/${state.currentProject.id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_request: clientRequest
      })
    });

    if (!analyzeRes.ok) throw new Error('Failed to analyze scope with AI.');
    state.currentScopeAnalysis = await analyzeRes.json();

    // Render results
    renderAnalysisResult(state.currentScopeAnalysis);
    
    // Add to audit history
    addToAuditLog({
      id: state.currentScopeAnalysis.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projectName: state.currentProject.title,
      channel: state.activeChannel,
      classification: state.currentScopeAnalysis.classification,
      price: (state.currentScopeAnalysis.amount_cents || 0) / 100,
      status: state.currentScopeAnalysis.classification,
      orderId: "-",
      explanation: state.currentScopeAnalysis.ai_summary || "Scope evaluated against signed statement of work."
    });

    showToast(`Analysis Complete: ${state.currentScopeAnalysis.classification}`, 'success');
  } catch (err) {
    console.error('Scope Analysis Error:', err);
    showToast(`Analysis error: ${err.message}`, 'error');
  } finally {
    elements.btnAnalyze.disabled = false;
    elements.btnAnalyze.innerHTML = `
      <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Analyze Scope & Diff Brief
    `;
  }
}

function renderAnalysisResult(analysis) {
  elements.emptyState.classList.add('hidden');
  elements.aiResultCard.classList.remove('hidden');

  const isIncluded = analysis.classification === 'INCLUDED';

  // Badge Status
  elements.analysisBadge.className = `status-badge ${isIncluded ? 'status-included' : 'status-extra'}`;
  elements.analysisBadge.textContent = analysis.classification;

  // Banner
  elements.classificationBanner.className = `classification-banner ${isIncluded ? 'banner-included' : 'banner-extra'}`;
  elements.classificationIcon.textContent = isIncluded ? '✅' : '⚡';
  elements.classificationTitle.textContent = isIncluded 
    ? 'Covered in Signed Contract' 
    : 'Out-of-Scope Work Detected';
  elements.classificationSubtitle.textContent = isIncluded
    ? 'Request matches agreed deliverables. Zero additional billing required.'
    : 'Requires merchant approval and a PayPal Orders v2 payment link.';

  // Confidence Score
  const confText = analysis.confidence || 'HIGH';
  elements.confidenceScore.textContent = confText === 'HIGH' ? '98%' : confText === 'MEDIUM' ? '82%' : '65%';

  // Explanations & Evidence
  elements.explanationText.textContent = analysis.ai_summary || 'Scope analysis completed against contractual SOW.';
  elements.sowEvidenceText.textContent = `"${analysis.evidence_quote || 'Directly correlates with signed contract deliverables.'}"`;

  // Itemized List
  elements.itemizedDeliverables.innerHTML = '';
  let items = [];
  try {
    if (analysis.extracted_items_json) {
      items = JSON.parse(analysis.extracted_items_json);
    }
  } catch (e) {
    items = [];
  }
  if (!items || items.length === 0) {
    items = isIncluded ? ['Minor CSS style adjustments', 'Typo fixes'] : ['PayPal / Stripe Checkout Integration', 'Analytics Reporting Graph'];
  }

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    elements.itemizedDeliverables.appendChild(li);
  });

  // Show conditional sections
  if (isIncluded) {
    elements.includedCallout.classList.remove('hidden');
    elements.paypalActionCard.classList.add('hidden');
  } else {
    elements.includedCallout.classList.add('hidden');
    elements.paypalActionCard.classList.remove('hidden');

    // Prepopulate price & notes
    const dollars = (analysis.amount_cents || 50000) / 100;
    elements.proposedPrice.value = dollars.toFixed(2);
    elements.merchantNotes.value = `Scope extension for ${state.currentProject ? state.currentProject.title : 'project'}: ${items.slice(0, 2).join(', ')}`;
    elements.orderStatusBox.classList.add('hidden');
  }
}

// ==========================================================================
// Step 2: Merchant Approval & PayPal Order Generation
// ==========================================================================
async function approveAndCreatePayPalOrder() {
  if (!state.currentScopeAnalysis) {
    showToast('No active scope analysis to approve.', 'warning');
    return;
  }

  const price = parseFloat(elements.proposedPrice.value);
  const notes = elements.merchantNotes.value.trim();

  if (isNaN(price) || price <= 0) {
    showToast('Please enter a valid billable price.', 'warning');
    return;
  }

  elements.btnApproveOrder.disabled = true;
  elements.btnApproveOrder.innerHTML = `<div class="btn-spinner"></div> Creating PayPal Order v2...`;

  try {
    const response = await fetch(`/api/scope/${state.currentScopeAnalysis.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: Math.round(price * 100),
        currency: "USD",
        merchant_notes: notes
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Failed to approve scope and generate PayPal Order.');
    }

    state.currentOrder = await response.json();
    renderOrderCreated(state.currentOrder);
    
    // Update audit entry
    updateAuditEntry(state.currentScopeAnalysis.id, {
      status: 'APPROVED',
      orderId: state.currentOrder.paypal_order_id,
      price: price
    });

    showToast(`PayPal Order Generated: ${state.currentOrder.paypal_order_id}`, 'success');
  } catch (err) {
    console.error('PayPal Order Error:', err);
    showToast(`Order creation error: ${err.message}`, 'error');
  } finally {
    elements.btnApproveOrder.disabled = false;
    elements.btnApproveOrder.innerHTML = `
      <svg class="btn-svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.784.784 0 0 1 .773-.654h6.315c2.903 0 5.033.724 6.16 2.095 1.05 1.278 1.27 3.09.654 5.385-.027.1-.06.204-.099.313-.807 3.018-2.905 4.885-6.236 4.885h-2.58a.784.784 0 0 0-.774.654l-.988 5.76a.64.64 0 0 1-.633.54z"/>
      </svg>
      Approve Terms & Create PayPal Order v2
    `;
  }
}

function renderOrderCreated(order) {
  elements.orderStatusBox.classList.remove('hidden');
  elements.orderIdCode.textContent = order.paypal_order_id || 'ORDER-SIMULATED';
  elements.idempotencyKey.textContent = `idemp_${order.paypal_order_id ? order.paypal_order_id.slice(-8) : 'demo'}`;
  
  elements.orderStatusPill.className = 'status-pill status-approved';
  elements.orderStatusPill.textContent = 'CREATED / AWAITING PAYMENT';

  // PayPal Approve Link
  const approveUrl = order.paypal_approve_url || `https://www.sandbox.paypal.com/checkoutnow?token=${order.paypal_order_id}`;
  elements.approveUrlLink.href = approveUrl;
  elements.approveUrlLink.innerHTML = `<span>Open PayPal Sandbox Checkout</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>`;

  // Ready Capture Section
  elements.captureSection.classList.remove('hidden');
  elements.captureSuccessBox.classList.add('hidden');
  elements.btnCapturePayment.disabled = false;
}

// ==========================================================================
// Step 3: Capture PayPal Payment
// ==========================================================================
async function capturePayment() {
  if (!state.currentScopeAnalysis) {
    showToast('No active scope change to capture.', 'warning');
    return;
  }

  const scopeId = state.currentScopeAnalysis.id;
  elements.btnCapturePayment.disabled = true;
  elements.btnCapturePayment.innerHTML = `<div class="btn-spinner"></div> Capturing via Orders v2...`;

  try {
    const response = await fetch(`/api/paypal/capture/${scopeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Capture failed via PayPal REST API.');
    const captureResult = await response.json();

    // Render success
    elements.captureSection.classList.add('hidden');
    elements.captureSuccessBox.classList.remove('hidden');
    elements.captureIdCode.textContent = captureResult.paypal_capture_id || `CAP-${Date.now()}`;
    elements.payerEmailCode.textContent = elements.merchantEmail.value || 'client@enterprise.com';

    elements.orderStatusPill.className = 'status-pill status-paid';
    elements.orderStatusPill.textContent = 'COMPLETED / PAID';

    // Update Audit
    updateAuditEntry(state.currentScopeAnalysis.id, {
      status: 'PAID',
      orderId: state.currentOrder ? state.currentOrder.paypal_order_id : '-'
    });

    showToast('Payment Captured Successfully via PayPal Orders v2!', 'success');
  } catch (err) {
    console.error('Capture Error:', err);
    showToast(`Payment capture error: ${err.message}`, 'error');
    elements.btnCapturePayment.disabled = false;
    elements.btnCapturePayment.textContent = 'Retry Capture';
  }
}

// ==========================================================================
// Audit Table & Export Tools
// ==========================================================================
function addToAuditLog(entry) {
  state.auditHistory.unshift(entry);
  renderAuditTable();
  updateKPIMetrics();
}

function updateAuditEntry(scopeId, updates) {
  const index = state.auditHistory.findIndex(e => e.id === scopeId);
  if (index !== -1) {
    state.auditHistory[index] = { ...state.auditHistory[index], ...updates };
    renderAuditTable();
    updateKPIMetrics();
  }
}

function renderAuditTable(filter = '') {
  if (!elements.auditTableBody) return;

  const filtered = state.auditHistory.filter(item => {
    if (!filter) return true;
    return item.projectName.toLowerCase().includes(filter) ||
           item.classification.toLowerCase().includes(filter) ||
           item.status.toLowerCase().includes(filter) ||
           item.orderId.toLowerCase().includes(filter);
  });

  if (filtered.length === 0) {
    elements.auditTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">No matching audit records found.</td>
      </tr>
    `;
    return;
  }

  elements.auditTableBody.innerHTML = filtered.map(item => {
    let statusClass = 'status-idle';
    if (item.status === 'INCLUDED') statusClass = 'status-included';
    if (item.status === 'EXTRA_PROPOSED') statusClass = 'status-extra';
    if (item.status === 'APPROVED' || item.status === 'MERCHANT_APPROVED') statusClass = 'status-approved';
    if (item.status === 'PAID') statusClass = 'status-paid';

    return `
      <tr>
        <td><span class="text-dim">${item.timestamp}</span></td>
        <td><strong>${escapeHtml(item.projectName)}</strong></td>
        <td><span class="channel-chip">${item.channel.toUpperCase()}</span></td>
        <td>
          <span class="status-badge ${item.classification === 'INCLUDED' ? 'status-included' : 'status-extra'}">
            ${item.classification}
          </span>
        </td>
        <td><strong>$${item.price.toFixed(2)}</strong></td>
        <td><span class="status-badge ${statusClass}">${item.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="inspectAuditRecord('${item.id}')">
            Inspect JSON
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateKPIMetrics() {
  const total = state.auditHistory.length;
  const includedCount = state.auditHistory.filter(i => i.classification === 'INCLUDED').length;
  const extraTotal = state.auditHistory.reduce((sum, i) => sum + (i.price || 0), 0);
  const paidCount = state.auditHistory.filter(i => i.status === 'PAID').length;
  const totalOrders = state.auditHistory.filter(i => i.price > 0).length;

  if (elements.kpiTotalScans) elements.kpiTotalScans.textContent = total;
  if (elements.kpiCreepPrevented) elements.kpiCreepPrevented.textContent = `$${(includedCount * 150).toLocaleString()}`;
  if (elements.kpiExtraProposed) elements.kpiExtraProposed.textContent = `$${extraTotal.toLocaleString()}`;
  if (elements.kpiCaptureRate) elements.kpiCaptureRate.textContent = totalOrders > 0 ? `${Math.round((paidCount / totalOrders) * 100)}%` : '100%';
}

// Modal Inspector
function inspectAuditRecord(recordId) {
  const record = state.auditHistory.find(r => r.id === recordId) || {
    id: recordId,
    timestamp: new Date().toISOString(),
    details: "ScopeGuard Audit Trace Record"
  };

  elements.modalJson.textContent = JSON.stringify(record, null, 2);
  elements.auditModal.classList.remove('hidden');
}

function closeModal() {
  elements.auditModal.classList.add('hidden');
}

// CSV Export Helper
function exportAuditLogCSV() {
  const headers = ["ID", "Timestamp", "Project Name", "Channel", "Classification", "Price (USD)", "Status", "Order ID", "Explanation"];
  const rows = state.auditHistory.map(r => [
    r.id,
    r.timestamp,
    `"${r.projectName.replace(/"/g, '""')}"`,
    r.channel,
    r.classification,
    r.price,
    r.status,
    r.orderId,
    `"${(r.explanation || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `scopeguard_audit_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Audit Log exported to CSV', 'success');
}

// Copy to Clipboard Utility
function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent || el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied to clipboard: ${text}`, 'info');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
