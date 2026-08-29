import { Deal, DealStage, ForecastStats, InboundEmail } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5040';

export async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch(`${API_BASE}/api/deals`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchDealById(id: number): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals/${id}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function createDeal(payload: {
  title: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  dealValue: number;
  currency?: string;
  ownerName?: string;
  customAttributesJson?: string;
}): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Deal creation failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function moveDealStage(id: number, targetStage: DealStage): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals/${id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStage })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Move stage failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function sendProposal(id: number): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals/${id}/proposal`, {
    method: 'POST'
  });

  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function markWon(id: number): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals/${id}/won`, {
    method: 'POST'
  });

  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function markLost(id: number, lostReasonCode: string): Promise<Deal> {
  const res = await fetch(`${API_BASE}/api/deals/${id}/lost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lostReasonCode })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Mark lost failed' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  return await res.json();
}

export async function fetchForecast(): Promise<ForecastStats> {
  const res = await fetch(`${API_BASE}/api/deals/forecast`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchEmails(): Promise<InboundEmail[]> {
  const res = await fetch(`${API_BASE}/api/emails`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function simulateInboundEmail(payload: {
  dealId?: number;
  from: string;
  subject: string;
  bodySnippet: string;
}): Promise<InboundEmail> {
  const res = await fetch(`${API_BASE}/api/emails/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}
