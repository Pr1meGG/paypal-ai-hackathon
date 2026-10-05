/**
 * ScopeGuard Enterprise — Strongly Typed System Contracts
 * Defines all TypeScript interfaces for Contract Governance, Scope Diffing, and PayPal Orders v2 REST
 */

export type Channel = 'slack' | 'jira' | 'email' | 'salesforce';

export type ClassificationType =
  | 'INCLUDED'
  | 'EXTRA_PROPOSED'
  | 'SCOPE_CREEP'
  | 'MERCHANT_APPROVED'
  | 'PAID'
  | 'WAIVED';

export type ConfidenceGrade = 'HIGH' | 'MEDIUM' | 'LOW';

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
  badge: string;
}

export interface WebhookResource {
  id: string;
  status: string;
  amount?: {
    value: string;
    currency_code: string;
  };
  intent?: string;
  payer?: {
    email_address: string;
  };
  seller_protection?: {
    status: string;
  };
}

export interface WebhookEventPayload {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: 'PAYMENT.CAPTURE.COMPLETED' | 'CHECKOUT.ORDER.APPROVED';
  summary: string;
  resource: WebhookResource;
}

export type ViewTab = 'workbench' | 'analytics' | 'webhooks' | 'contracts';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
