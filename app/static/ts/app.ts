/**
 * ScopeGuard Enterprise — Frontend Application Controller (TypeScript)
 * Handles Contract Scope Diffing, Enterprise Audits, and PayPal Orders v2 REST Lifecycle
 */

// ============================================================================
// 1. Type Definitions & Contracts
// ============================================================================

export type Channel = 'slack' | 'jira' | 'email' | 'salesforce';

export type ClassificationType =
  | 'INCLUDED'
  | 'EXTRA_PROPOSED'
  | 'SCOPE_CREEP'
  | 'MERCHANT_APPROVED'
  | 'PAID'
  | 'WAIVED';

export type ViewTab = 'workbench' | 'analytics' | 'webhooks' | 'contracts';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ScopeAnalysisRequest {
  client_name?: string;
  project_name?: string;
  client_email?: string;
  contract_sow: string;
  client_request: string;
  client_message?: string;
  request_channel?: Channel;
  source_channel?: string;
}

export interface ScopeAnalysisResponse {
  id: string;
  project_id: string;
  status: string;
  classification: ClassificationType;
  confidence: number;
  confidence_score: number;
  reasoning: string;
  relevant_sow_clause: string;
  contract_quote: string;
  itemized_scope: string[];
  itemized_deliverables: string[];
  suggested_price: number;
  request_channel: Channel;
}

export interface PayPalOrderCreateRequest {
  client_name?: string;
  client_email?: string;
  item_name?: string;
  description?: string;
  amount: number;
  currency?: string;
  scope_analysis_id?: string;
  notes?: string;
}

export interface PayPalOrderResponse {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_url: string;
  approve_url: string;
  client_email: string;
  item_name: string;
}

export interface PayPalCaptureResponse {
  order_id: string;
  capture_id: string;
  status: string;
  amount: number;
  currency: string;
  fee: number;
  payer_email: string;
}

export interface AuditLedgerRecord {
  id: string;
  timestamp: string;
  client: string;
  channel: string;
  classification: string;
  confidence: string;
  amount: number;
  status: string;
}

export interface KPITelemetry {
  activeContracts: number;
  proposalsCaptured: number;
  settlementVolume: number;
  complianceScore: number;
}

export interface PresetScenario {
  client_name: string;
  client_email: string;
  channel: Channel;
  contract: string;
  request: string;
}

// ============================================================================
// 2. Preset Scenarios Data Store
// ============================================================================

const PRESETS: Record<string, PresetScenario> = {
  db_migration: {
    client_name: "Apex Global Logistics Inc.",
    client_email: "procurement@apexlogistics.com",
    channel: "slack",
    contract: `MASTER SERVICES AGREEMENT - EXHIBIT A: SCOPE OF WORK
1. CORE SERVICES
1.1 Provider shall deliver a React web application frontend and Node.js REST API backend.
1.2 Provider shall implement PostgreSQL schema design and deploy on existing AWS RDS instances.
1.3 Target timeline: 12 calendar weeks from kickoff.

2. EXCLUSIONS & CHANGE CONTROL
2.1 Database migration from legacy Oracle 11g or mainframe on-premise systems is explicitly EXCLUDED from base fees.
2.2 Any zero-downtime data ETL or parallel sync pipelines require an approved Contractual Change Order at standard senior engineering rates ($175/hr).`,
    request: "Hi ScopeGuard team, per our executive steering committee meeting yesterday, we need you to migrate our 850GB Oracle 11g database to PostgreSQL with zero-downtime ETL before next Friday's product launch."
  },
  sso_rbac: {
    client_name: "FinTech Prime Capital",
    client_email: "vendor-management@primecap.io",
    channel: "jira",
    contract: `STATEMENT OF WORK #2026-FPC-09
1. SCOPE OF SERVICES
1.1 Implementation of standard email/password authentication using AWS Cognito.
1.2 User session management with JWT tokens and 15-minute rotation.

2. OUT OF SCOPE
2.1 SAML 2.0 / Okta / Azure AD Enterprise Single Sign-On (SSO) integration.
2.2 Custom RBAC permission matrix beyond basic Admin/User roles. Any enterprise IAM enhancements require a separate Change Authorization of $3,500.00.`,
    request: "JIRA SEC-402: Security Audit Requirement - Enterprise Okta SAML 2.0 SSO and granular Role-Based Access Control (RBAC) with 6 permission tiers must be enabled for our production release."
  },
  minor_fix: {
    client_name: "Nordic Commerce ApS",
    client_email: "tech@nordiccommerce.dk",
    channel: "email",
    contract: `PROFESSIONAL SERVICES CONTRACT
1. WARRANTY & BUG FIXES
1.1 Provider warrants that the deliverables will substantially conform to specifications for 90 days following acceptance.
1.2 Provider will correct minor defect reports, UI alignment issues, and typography styling bugs within 2 business days at no additional charge.`,
    request: "Hello team, we noticed the navigation bar brand logo on the checkout page is shifted 4px to the left on mobile viewport Safari. Can you please align it per the Figma spec?"
  }
};

// ============================================================================
// 3. Reactive State Store
// ============================================================================

interface AppState {
  currentView: ViewTab;
  currentChannel: Channel;
  currentAnalysis: ScopeAnalysisResponse | null;
  activeOrderId: string | null;
  activeOrderData: PayPalOrderResponse | null;
  activeCaptureData: PayPalCaptureResponse | null;
  auditLog: AuditLedgerRecord[];
  kpi: KPITelemetry;
}

const state: AppState = {
  currentView: 'workbench',
  currentChannel: 'slack',
  currentAnalysis: null,
  activeOrderId: null,
  activeOrderData: null,
  activeCaptureData: null,
  auditLog: [],
  kpi: {
    activeContracts: 14,
    proposalsCaptured: 3,
    settlementVolume: 7950.00,
    complianceScore: 99.8
  }
};

// ============================================================================
// 4. Strongly Typed API Client
// ============================================================================

class ScopeGuardApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) {
          errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // use fallback
      }
      throw new Error(errorDetail);
    }

    return (await res.json()) as T;
  }

  public static async analyzeScope(payload: ScopeAnalysisRequest): Promise<ScopeAnalysisResponse> {
    return this.request<ScopeAnalysisResponse>('/api/scope/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async createOrder(payload: PayPalOrderCreateRequest): Promise<PayPalOrderResponse> {
    return this.request<PayPalOrderResponse>('/api/paypal/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    return this.request<PayPalCaptureResponse>(`/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST'
    });
  }

  public static async getHistory(): Promise<AuditLedgerRecord[]> {
    return this.request<AuditLedgerRecord[]>('/api/scope/history');
  }
}

// ============================================================================
// 5. Core Application Controller & UI Logic
// ============================================================================

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  renderKpis();
  loadInitialLedger();
  setupLedgerFilter();
  setupInteractiveEnhancements();
  setupKeyboardShortcuts();
});

function setupInteractiveEnhancements(): void {
  const priceInput = document.getElementById('order-price') as HTMLInputElement | null;
  if (priceInput) {
    priceInput.addEventListener('input', () => {
      const val = parseFloat(priceInput.value);
      if (!isNaN(val) && val > 0) {
        const fee = Math.round((val * 0.0349 + 0.49) * 100) / 100;
        const net = Math.round((val - fee) * 100) / 100;
        const feeEl = document.getElementById('estimated-fee-display');
        if (feeEl) {
          feeEl.textContent = `Est. PayPal Fee: $${fee.toFixed(2)} | Net Settlement: $${net.toFixed(2)}`;
        }
      }
    });
  }

  // Live character/word count on contract textarea
  const contractInput = document.getElementById('input-contract') as HTMLTextAreaElement | null;
  if (contractInput) {
    contractInput.addEventListener('input', () => {
      const words = contractInput.value.trim().split(/\s+/).filter(Boolean).length;
      const sub = document.getElementById('contract-word-count');
      if (sub) {
        sub.textContent = `${words} words | Baseline Brief`;
      }
    });
  }
}

function setupKeyboardShortcuts(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Only execute if not currently typing in a form input
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        executeScopeDiff();
      }
      return;
    }

    if (e.key === '1') {
      loadScenario('db_migration');
    } else if (e.key === '2') {
      loadScenario('sso_rbac');
    } else if (e.key === '3') {
      loadScenario('minor_fix');
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
  });
}

// Navigation View Switcher
export function switchView(viewName: ViewTab): void {
  state.currentView = viewName;
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const el = tab as HTMLElement;
    tab.classList.toggle('active', el.dataset.view === viewName);
  });
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
  if (viewName === 'analytics') {
    refreshLedgerTable();
  }
}

// Select Ingestion Channel
export function selectChannel(channel: Channel): void {
  state.currentChannel = channel;
  document.querySelectorAll('.ch-tab').forEach(btn => {
    const el = btn as HTMLElement;
    btn.classList.toggle('active', el.dataset.channel === channel);
  });
}

// Load Pre-packaged Scenario
export function loadScenario(presetKey: string): void {
  const p = PRESETS[presetKey];
  if (!p) return;

  document.querySelectorAll('.scenario-pill').forEach(pill => {
    const el = pill as HTMLElement;
    pill.classList.toggle('active', el.dataset.scenario === presetKey);
  });

  const clientEl = document.getElementById('input-client') as HTMLInputElement | null;
  const emailEl = document.getElementById('input-email') as HTMLInputElement | null;
  const contractEl = document.getElementById('input-contract') as HTMLTextAreaElement | null;
  const requestEl = document.getElementById('input-request') as HTMLTextAreaElement | null;

  if (clientEl) clientEl.value = p.client_name;
  if (emailEl) emailEl.value = p.client_email;
  if (contractEl) contractEl.value = p.contract;
  if (requestEl) requestEl.value = p.request;

  selectChannel(p.channel);
  showToast(`Loaded "${p.client_name}" scenario`, 'info');
}

// Scope Diff Execution
export async function executeScopeDiff(): Promise<void> {
  const clientName = (document.getElementById('input-client') as HTMLInputElement)?.value.trim();
  const clientEmail = (document.getElementById('input-email') as HTMLInputElement)?.value.trim();
  const contractSow = (document.getElementById('input-contract') as HTMLTextAreaElement)?.value.trim();
  const clientRequest = (document.getElementById('input-request') as HTMLTextAreaElement)?.value.trim();

  if (!contractSow || !clientRequest) {
    showToast('Statement of Work and Client Request are required', 'warning');
    return;
  }

  const btn = document.getElementById('btn-analyze') as HTMLButtonElement | null;
  const btnText = document.getElementById('btn-analyze-text');
  const emptyState = document.getElementById('diff-empty-state');
  const resultContainer = document.getElementById('diff-result-container');
  const statusBadge = document.getElementById('diff-status-badge');

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner"></span> Comparing Semantics...';
  if (statusBadge) {
    statusBadge.className = 'status-pill status-evaluating';
    statusBadge.textContent = 'EVALUATING';
  }

  try {
    const payload: ScopeAnalysisRequest = {
      client_name: clientName || "Enterprise Client",
      client_email: clientEmail || "procurement@client.com",
      contract_sow: contractSow,
      client_request: clientRequest,
      request_channel: state.currentChannel
    };

    const data = await ScopeGuardApi.analyzeScope(payload);
    state.currentAnalysis = data;

    renderScopeResults(data);

    // Record into Audit Ledger
    recordAuditEntry({
      id: data.id || `AUD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      client: clientName || "Enterprise Client",
      channel: state.currentChannel.toUpperCase(),
      classification: data.classification,
      confidence: `${(data.confidence_score * 100).toFixed(1)}%`,
      amount: data.suggested_price,
      status: data.classification === 'INCLUDED' ? 'WAIVED' : 'PENDING_ORDER'
    });

    if (emptyState) emptyState.classList.add('hidden');
    if (resultContainer) resultContainer.classList.remove('hidden');

    showToast(`Analysis complete: ${data.classification}`, 'success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error processing contract scope comparison';
    console.error(err);
    showToast(message, 'error');
    if (statusBadge) {
      statusBadge.className = 'status-pill status-ready';
      statusBadge.textContent = 'READY';
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) {
      btnText.innerHTML = `
        <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"/>
          <path d="M14 2V8H20"/>
          <path d="M16 13H8"/>
          <path d="M16 17H8"/>
          <path d="M10 9H8"/>
        </svg>
        Run Contract Scope Diff Engine
      `;
    }
  }
}

// Render Results to UI
function renderScopeResults(data: ScopeAnalysisResponse): void {
  const isExtra = (data.classification === 'EXTRA_PROPOSED' || data.classification === 'SCOPE_CREEP');
  const banner = document.getElementById('verdict-banner');
  const icon = document.getElementById('verdict-icon');
  const title = document.getElementById('verdict-title');
  const desc = document.getElementById('verdict-desc');
  const conf = document.getElementById('verdict-confidence');
  const statusBadge = document.getElementById('diff-status-badge');

  if (isExtra) {
    if (statusBadge) {
      statusBadge.className = 'status-pill status-extra';
      statusBadge.textContent = 'SCOPE_CREEP DETECTED';
    }
    if (banner) {
      banner.className = 'verdict-banner banner-extra';
    }
    if (title) title.textContent = 'SCOPE DEVIATION DETECTED — BILLABLE CHANGE ORDER';
    if (desc) desc.textContent = 'The client request exceeds the signed Statement of Work baseline.';
    if (icon) {
      icon.innerHTML = `
        <svg class="verdict-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.56 21H20.44A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    }
  } else {
    if (statusBadge) {
      statusBadge.className = 'status-pill status-inscope';
      statusBadge.textContent = 'IN_SCOPE';
    }
    if (banner) {
      banner.className = 'verdict-banner banner-inscope';
    }
    if (title) title.textContent = 'IN-SCOPE DELIVERABLE — COVERED UNDER WARRANTY';
    if (desc) desc.textContent = 'The client request is fully covered under the existing contract agreement.';
    if (icon) {
      icon.innerHTML = `
        <svg class="verdict-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12A10 10 0 1 1 11.21 2.04"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    }
  }

  if (conf) conf.textContent = `${(data.confidence_score * 100).toFixed(1)}%`;

  const reasoningEl = document.getElementById('audit-reasoning');
  if (reasoningEl) reasoningEl.textContent = data.reasoning;

  const clauseEl = document.getElementById('audit-clause');
  if (clauseEl) {
    const quote = data.relevant_sow_clause || data.contract_quote || 'Clause Citation: Scope of Work Section 2.1';
    clauseEl.textContent = quote;
  }

  // Render Itemized Deliverables
  const listEl = document.getElementById('audit-items');
  if (listEl) {
    listEl.innerHTML = '';
    const deliverables = data.itemized_deliverables || data.itemized_scope || [];
    if (deliverables.length === 0) {
      const li = document.createElement('li');
      li.textContent = '1. Enterprise delivery per contractual specifications.';
      listEl.appendChild(li);
    } else {
      deliverables.forEach((item, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${item}`;
        listEl.appendChild(li);
      });
    }
  }

  // Handle In-scope callout vs PayPal console
  const inScopeCallout = document.getElementById('inscope-callout');
  const paypalConsole = document.getElementById('paypal-console');
  const orderVerification = document.getElementById('order-verification');
  const captureSuccess = document.getElementById('capture-success');

  if (orderVerification) orderVerification.classList.add('hidden');
  if (captureSuccess) captureSuccess.classList.add('hidden');

  if (isExtra) {
    if (inScopeCallout) inScopeCallout.classList.add('hidden');
    if (paypalConsole) paypalConsole.classList.remove('hidden');

    const priceEl = document.getElementById('order-price') as HTMLInputElement | null;
    const deliverableEl = document.getElementById('order-deliverable') as HTMLInputElement | null;
    if (priceEl) priceEl.value = (data.suggested_price || 2500.00).toFixed(2);
    if (deliverableEl) {
      const deliverables = data.itemized_deliverables || data.itemized_scope || [];
      deliverableEl.value = deliverables.join('; ') || 'Contractual Change Order Deliverable';
    }
  } else {
    if (inScopeCallout) inScopeCallout.classList.remove('hidden');
    if (paypalConsole) paypalConsole.classList.add('hidden');
  }
}

// Initiate PayPal Orders v2 REST Order Creation
export async function initiatePayPalOrder(): Promise<void> {
  const priceInput = (document.getElementById('order-price') as HTMLInputElement)?.value;
  const deliverable = (document.getElementById('order-deliverable') as HTMLInputElement)?.value;
  const clientName = (document.getElementById('input-client') as HTMLInputElement)?.value || "Enterprise Client";
  const clientEmail = (document.getElementById('input-email') as HTMLInputElement)?.value || "procurement@client.com";

  const amount = parseFloat(priceInput);
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid authorized price', 'warning');
    return;
  }

  const btn = document.getElementById('btn-create-order') as HTMLButtonElement | null;
  const btnText = document.getElementById('btn-create-order-text');
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner"></span> Creating Order via v2/checkout/orders...';

  try {
    const payload: PayPalOrderCreateRequest = {
      client_name: clientName,
      client_email: clientEmail,
      item_name: deliverable || "Contractual Change Order",
      amount: amount,
      currency: "USD",
      scope_analysis_id: state.currentAnalysis ? state.currentAnalysis.id : undefined
    };

    const data = await ScopeGuardApi.createOrder(payload);
    state.activeOrderId = data.id;
    state.activeOrderData = data;

    // Render Order Details
    const idDisplay = document.getElementById('order-id-display');
    const amountDisplay = document.getElementById('order-amount-display');
    const checkoutLink = document.getElementById('order-checkout-link') as HTMLAnchorElement | null;

    if (idDisplay) idDisplay.textContent = data.id;
    if (amountDisplay) amountDisplay.textContent = `$${data.amount.toFixed(2)} ${data.currency}`;

    if (checkoutLink && data.approve_url) {
      checkoutLink.href = data.approve_url;
      checkoutLink.classList.remove('hidden');
    }

    const verificationEl = document.getElementById('order-verification');
    if (verificationEl) verificationEl.classList.remove('hidden');

    const statusBadge = document.getElementById('diff-status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-pill status-created';
      statusBadge.textContent = 'ORDER_CREATED';
    }

    showToast(`PayPal Order Created: ${data.id}`, 'success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create PayPal Order';
    console.error(err);
    showToast(message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) {
      btnText.innerHTML = `
        <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Authorize & Generate PayPal Order
      `;
    }
  }
}

// Execute PayPal Capture (POST /v2/checkout/orders/{id}/capture)
export async function executePayPalCapture(): Promise<void> {
  if (!state.activeOrderId) {
    showToast('No active PayPal order to capture', 'warning');
    return;
  }

  const btn = document.getElementById('btn-capture-order') as HTMLButtonElement | null;
  const btnText = document.getElementById('btn-capture-order-text');
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner"></span> Capturing Funds...';

  try {
    const data = await ScopeGuardApi.captureOrder(state.activeOrderId);
    state.activeCaptureData = data;

    // Display Verified Receipt
    const capIdDisplay = document.getElementById('receipt-capture-id');
    const amtDisplay = document.getElementById('receipt-amount');
    const feeDisplay = document.getElementById('receipt-fee');
    const payerDisplay = document.getElementById('receipt-payer');
    const captureSuccess = document.getElementById('capture-success');

    if (capIdDisplay) capIdDisplay.textContent = data.capture_id || `CAP-${Date.now().toString(36).toUpperCase()}`;
    if (amtDisplay) amtDisplay.textContent = `$${data.amount.toFixed(2)} USD`;
    if (feeDisplay) feeDisplay.textContent = `$${(data.fee || 0).toFixed(2)} USD`;
    if (payerDisplay) payerDisplay.textContent = data.payer_email || ((document.getElementById('input-email') as HTMLInputElement)?.value || 'buyer@client.com');

    if (captureSuccess) captureSuccess.classList.remove('hidden');

    const statusBadge = document.getElementById('diff-status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-pill status-paid';
      statusBadge.textContent = 'FUNDS_CAPTURED';
    }

    // Update KPI state
    state.kpi.proposalsCaptured += 1;
    state.kpi.settlementVolume += data.amount;
    renderKpis();

    // Update Ledger record
    updateLedgerStatus(state.activeOrderId, 'CAPTURED');

    showToast('PayPal settlement captured and verified', 'success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Capture execution failed';
    console.error(err);
    showToast(message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) {
      btnText.innerHTML = `
        <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12A10 10 0 1 1 11.21 2.04"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Simulate Immediate Client Capture
      `;
    }
  }
}

// KPI Ribbon Rendering
function renderKpis(): void {
  const elContracts = document.getElementById('kpi-active-contracts');
  const elCaptured = document.getElementById('kpi-proposals-captured');
  const elVol = document.getElementById('kpi-settlement-vol');
  const elScore = document.getElementById('kpi-compliance-score');

  if (elContracts) elContracts.textContent = state.kpi.activeContracts.toString();
  if (elCaptured) elCaptured.textContent = state.kpi.proposalsCaptured.toString();
  if (elVol) elVol.textContent = `$${state.kpi.settlementVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (elScore) elScore.textContent = `${state.kpi.complianceScore}%`;
}

// Initial Audit Ledger Records
function loadInitialLedger(): void {
  state.auditLog = [
    {
      id: "AUD-8849-AC",
      timestamp: "2026-10-04 14:22:10",
      client: "Vertex Systems Corp",
      channel: "SLACK",
      classification: "EXTRA_PROPOSED",
      confidence: "98.4%",
      amount: 4200.00,
      status: "CAPTURED"
    },
    {
      id: "AUD-7731-FB",
      timestamp: "2026-10-03 09:15:42",
      client: "Meridian Financial",
      channel: "JIRA",
      classification: "INCLUDED",
      confidence: "99.1%",
      amount: 0.00,
      status: "WAIVED"
    },
    {
      id: "AUD-6510-NX",
      timestamp: "2026-10-01 17:40:05",
      client: "Quantum Commerce Inc.",
      channel: "EMAIL",
      classification: "EXTRA_PROPOSED",
      confidence: "97.6%",
      amount: 3750.00,
      status: "CAPTURED"
    }
  ];
  refreshLedgerTable();
}

function recordAuditEntry(entry: AuditLedgerRecord): void {
  state.auditLog.unshift(entry);
  refreshLedgerTable();
}

function updateLedgerStatus(_orderId: string, newStatus: string): void {
  if (state.auditLog.length > 0) {
    state.auditLog[0].status = newStatus;
    refreshLedgerTable();
  }
}

export function refreshLedgerTable(): void {
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;

  const query = ((document.getElementById('ledger-search') as HTMLInputElement | null)?.value || '').toLowerCase();
  tbody.innerHTML = '';

  const filtered = state.auditLog.filter(item =>
    item.client.toLowerCase().includes(query) ||
    item.id.toLowerCase().includes(query) ||
    item.classification.toLowerCase().includes(query)
  );

  filtered.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${row.id}</code></td>
      <td>${row.timestamp}</td>
      <td><strong>${row.client}</strong></td>
      <td><span class="step-tag">${row.channel}</span></td>
      <td><span class="status-pill ${row.classification === 'INCLUDED' ? 'status-inscope' : 'status-extra'}">${row.classification}</span></td>
      <td><code>${row.confidence}</code></td>
      <td><strong>$${row.amount.toFixed(2)}</strong></td>
      <td><span class="status-pill ${row.status === 'CAPTURED' ? 'status-paid' : (row.status === 'WAIVED' ? 'status-ready' : 'status-created')}">${row.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupLedgerFilter(): void {
  const search = document.getElementById('ledger-search');
  if (search) {
    search.addEventListener('input', () => refreshLedgerTable());
  }
}

// Export Ledger as CSV
export function exportLedgerCsv(): void {
  const headers = ["Audit_ID", "Timestamp", "Client", "Channel", "Classification", "Confidence", "Amount_USD", "Settlement_Status"];
  const rows = state.auditLog.map(r => [
    r.id,
    `"${r.timestamp}"`,
    `"${r.client}"`,
    r.channel,
    r.classification,
    r.confidence,
    r.amount.toFixed(2),
    r.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `scopeguard_audit_ledger_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Ledger CSV exported successfully", "success");
}

// Webhook Dispatcher
export function dispatchWebhook(eventType: string): void {
  const viewer = document.getElementById('webhook-json-viewer');
  const list = document.getElementById('webhook-event-list');
  const now = new Date().toISOString();
  const eventId = `WH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  let payload: Record<string, unknown> = {};
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    payload = {
      id: eventId,
      event_version: "1.0",
      create_time: now,
      resource_type: "capture",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      summary: "Payment capture completed successfully for Change Order deliverable",
      resource: {
        id: `CAP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "COMPLETED",
        amount: {
          value: (state.currentAnalysis ? state.currentAnalysis.suggested_price : 2500.00).toFixed(2),
          currency_code: "USD"
        },
        seller_protection: { status: "ELIGIBLE" }
      }
    };
  } else {
    payload = {
      id: eventId,
      event_version: "1.0",
      create_time: now,
      resource_type: "checkout-order",
      event_type: "CHECKOUT.ORDER.APPROVED",
      summary: "Buyer authorized PayPal Checkout order",
      resource: {
        id: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "APPROVED",
        intent: "CAPTURE",
        payer: { email_address: "procurement@apexlogistics.com" }
      }
    };
  }

  if (viewer) viewer.textContent = JSON.stringify(payload, null, 2);

  if (list) {
    const item = document.createElement('div');
    item.className = 'webhook-item';
    item.innerHTML = `
      <div class="item-head">
        <span class="event-badge ${eventType.includes('CAPTURE') ? 'badge-green' : 'badge-blue'}">${eventType}</span>
        <span class="item-time">${now.substring(11, 19)}</span>
      </div>
      <div class="item-body">Delivered to endpoint <code>/api/webhooks/paypal</code> (Status: 200 OK)</div>
    `;
    list.insertBefore(item, list.firstChild);
  }

  showToast(`Simulated Webhook Dispatched: ${eventType}`, 'success');
}

// Contract Vault Loader
export function loadVaultContract(key: string): void {
  switchView('workbench');
  loadScenario(key);
}

// Modal Controllers
export function openIntegrationModal(): void {
  document.getElementById('modal-integration')?.classList.remove('hidden');
}

export function openQrModal(): void {
  document.getElementById('modal-qr')?.classList.remove('hidden');
}

export function hideModal(modalId: string): void {
  document.getElementById(modalId)?.classList.add('hidden');
}

// Clipboard Helper
export function copyValue(elementId: string): void {
  const el = document.getElementById(elementId) as HTMLInputElement | HTMLElement | null;
  if (!el) return;
  const text = (el as HTMLInputElement).value || el.textContent || '';
  copyText(text);
}

export function copyText(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard', 'info');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Enterprise Toast System
export function showToast(message: string, type: ToastType = 'info'): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-dot"></div>
    <span>${message}</span>
  `;

  root.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

// Expose functions to global window object for HTML onclick handlers
(window as unknown as Record<string, unknown>).switchView = switchView;
(window as unknown as Record<string, unknown>).selectChannel = selectChannel;
(window as unknown as Record<string, unknown>).loadScenario = loadScenario;
(window as unknown as Record<string, unknown>).executeScopeDiff = executeScopeDiff;
(window as unknown as Record<string, unknown>).initiatePayPalOrder = initiatePayPalOrder;
(window as unknown as Record<string, unknown>).executePayPalCapture = executePayPalCapture;
(window as unknown as Record<string, unknown>).exportLedgerCsv = exportLedgerCsv;
(window as unknown as Record<string, unknown>).dispatchWebhook = dispatchWebhook;
(window as unknown as Record<string, unknown>).loadVaultContract = loadVaultContract;
(window as unknown as Record<string, unknown>).openIntegrationModal = openIntegrationModal;
(window as unknown as Record<string, unknown>).openQrModal = openQrModal;
(window as unknown as Record<string, unknown>).hideModal = hideModal;
(window as unknown as Record<string, unknown>).copyValue = copyValue;
(window as unknown as Record<string, unknown>).copyText = copyText;
(window as unknown as Record<string, unknown>).showToast = showToast;
