'use client';

import React, { useState, useEffect } from 'react';
import { Deal, DealStage } from '@/lib/types';
import { fetchDeals, createDeal, moveDealStage, sendProposal, markWon, markLost } from '@/lib/api';
import { Plus, ArrowRight, CheckCircle2, XCircle, Send, DollarSign, Building2, User, Phone, Mail, FileText, AlertCircle, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const STAGES: { key: DealStage; label: string; prob: string; colClass: string }[] = [
  { key: 'LEAD', label: '1. Leads (New)', prob: '10%', colClass: 'column-lead' },
  { key: 'QUALIFIED', label: '2. Qualified (BANT)', prob: '40%', colClass: 'column-qualified' },
  { key: 'PROPOSAL', label: '3. Proposal Sent', prob: '75%', colClass: 'column-proposal' },
  { key: 'WON', label: '4. Closed Won 🏆', prob: '100%', colClass: 'column-won' },
  { key: 'LOST', label: '5. Closed Lost', prob: '0%', colClass: 'column-lost' },
];

export default function SalesRepView() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [selectedDealForLost, setSelectedDealForLost] = useState<Deal | null>(null);
  const [lostReasonCode, setLostReasonCode] = useState('PRICE_TOO_HIGH');
  const [activeDealDetails, setActiveDealDetails] = useState<Deal | null>(null);

  // New Deal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newValue, setNewValue] = useState<number>(500000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    const list = await fetchDeals();
    setDeals(list);
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newCompany) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createDeal({
        title: newTitle,
        companyName: newCompany,
        contactPerson: newContact,
        email: newEmail,
        phone: newPhone,
        dealValue: Number(newValue),
        ownerName: 'Alex Mercer'
      });

      setIsNewDealOpen(false);
      setNewTitle('');
      setNewCompany('');
      setNewContact('');
      setNewEmail('');
      setNewPhone('');
      await loadDeals();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      setErrorMessage(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProgressStage(deal: Deal) {
    setErrorMessage(null);
    try {
      if (deal.stage === 'LEAD') {
        await moveDealStage(deal.id, 'QUALIFIED');
      } else if (deal.stage === 'QUALIFIED') {
        await sendProposal(deal.id); // Triggers AccountingBridge
      } else if (deal.stage === 'PROPOSAL') {
        await markWon(deal.id); // Triggers SignalR.BroadcastWon & Forecast
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      }
      await loadDeals();
    } catch (err: any) {
      alert('Transition rejected: ' + err.message);
    }
  }

  async function handleMarkLostSubmit() {
    if (!selectedDealForLost || !lostReasonCode) return;
    try {
      await markLost(selectedDealForLost.id, lostReasonCode);
      setSelectedDealForLost(null);
      await loadDeals();
    } catch (err: any) {
      alert('Mark lost failed: ' + err.message);
    }
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px 16px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign style={{ color: 'var(--accent-emerald)', width: 28, height: 28 }} />
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Enterprise Sales Pipeline & Deal Desk</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Sequential stage progress • Accounting quotation bridge • Real-time deal won broadcast
          </p>
        </div>

        <button
          onClick={() => setIsNewDealOpen(true)}
          className="btn-primary"
          style={{ fontSize: '0.9rem' }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Create New Deal
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {STAGES.map(stageInfo => {
          const stageDeals = deals.filter(d => d.stage === stageInfo.key);
          const totalStageValue = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);

          return (
            <div
              key={stageInfo.key}
              className={`glass-panel ${stageInfo.colClass}`}
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '680px', background: 'rgba(15, 23, 42, 0.65)' }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{stageInfo.label}</span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {stageDeals.length}
                </span>
              </div>

              {/* Total Value in Column */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                Total: <strong style={{ color: '#f8fafc' }}>{totalStageValue.toLocaleString()} ฿</strong> • Win Prob: {stageInfo.prob}
              </div>

              {/* Deal Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => setActiveDealDetails(deal)}
                    className="glass-panel glass-panel-hover"
                    style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', border: '1px solid var(--border-glass)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', lineHeight: '1.3' }}>
                        {deal.title}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 style={{ width: 13, height: 13 }} /> {deal.companyName}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '10px' }}>
                      <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {deal.dealValue.toLocaleString()} {deal.currency}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {deal.probability}% Prob
                      </span>
                    </div>

                    {/* Quotation Tag if Proposal */}
                    {deal.quotationNumber && (
                      <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText style={{ width: 12, height: 12 }} /> {deal.quotationNumber}
                      </div>
                    )}

                    {/* Lost Reason if Lost */}
                    {deal.lostReasonCode && (
                      <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px' }}>
                        Reason: {deal.lostReasonCode}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {deal.stage !== 'WON' && deal.stage !== 'LOST' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleProgressStage(deal)}
                          className="btn-primary"
                          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}
                        >
                          {deal.stage === 'LEAD' && 'Qualify →'}
                          {deal.stage === 'QUALIFIED' && 'Send Quotation 🧾'}
                          {deal.stage === 'PROPOSAL' && 'Mark Won 🏆'}
                        </button>
                        <button
                          onClick={() => setSelectedDealForLost(deal)}
                          style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Lost
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      {isNewDealOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Sales Deal</h3>
              <button onClick={() => setIsNewDealOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deal Title / Opportunity *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise License Expansion (500 users)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siam Retail Group"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deal Value (THB) *</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="10000"
                    value={newValue}
                    onChange={e => setNewValue(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#10b981', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Somchai (VP IT)"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. somchai@company.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsNewDealOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Creating...' : 'Create Deal (LEAD Stage)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Lost Modal enforcing Invariant: LostRequiresReasonCode */}
      {selectedDealForLost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--accent-rose)' }}>
              Mark Deal as Lost
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Invariant Rule [LostRequiresReasonCode]: You must provide an audit reason code.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Select Primary Loss Reason:
              </label>
              <select
                value={lostReasonCode}
                onChange={e => setLostReasonCode(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="PRICE_TOO_HIGH" style={{ background: '#0f172a' }}>PRICE_TOO_HIGH (Budget constraints)</option>
                <option value="COMPETITOR_CHOSEN" style={{ background: '#0f172a' }}>COMPETITOR_CHOSEN (Selected alternative vendor)</option>
                <option value="NO_BUDGET" style={{ background: '#0f172a' }}>NO_BUDGET (Project cancelled / postponed)</option>
                <option value="TIMING_MISMATCH" style={{ background: '#0f172a' }}>TIMING_MISMATCH (Implementation timeline too far)</option>
                <option value="FEATURE_GAP" style={{ background: '#0f172a' }}>FEATURE_GAP (Missing specific requirement)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedDealForLost(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleMarkLostSubmit} className="btn-danger">Confirm Close Lost</button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Details Sheet */}
      {activeDealDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}>
          <div className="glass-panel" style={{ width: '480px', height: '100%', borderRadius: 0, borderRight: 'none', padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className={`badge-${activeDealDetails.stage.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {activeDealDetails.stage} ({activeDealDetails.probability}%)
              </span>
              <button onClick={() => setActiveDealDetails(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>{activeDealDetails.title}</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '16px' }} className="font-mono">
              {activeDealDetails.dealValue.toLocaleString()} {activeDealDetails.currency}
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '6px' }}>🏢 <strong>Company:</strong> {activeDealDetails.companyName}</div>
              <div style={{ marginBottom: '6px' }}>👤 <strong>Contact:</strong> {activeDealDetails.contactPerson}</div>
              <div style={{ marginBottom: '6px' }}>✉️ <strong>Email:</strong> {activeDealDetails.email || 'N/A'}</div>
              <div>📞 <strong>Phone:</strong> {activeDealDetails.phone || 'N/A'}</div>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>Activity & Audit Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {activeDealDetails.activities?.map(act => (
                <div key={act.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{act.title}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{act.description}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                    {act.author} • {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
