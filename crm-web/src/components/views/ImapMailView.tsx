'use client';

import React, { useState, useEffect } from 'react';
import { InboundEmail, Deal } from '@/lib/types';
import { fetchEmails, fetchDeals, simulateInboundEmail } from '@/lib/api';
import { Mail, Inbox, Send, Link as LinkIcon, RefreshCw, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ImapMailView() {
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | ''>('');
  const [fromEmail, setFromEmail] = useState('client@enterprise.com');
  const [subject, setSubject] = useState('Urgent inquiry regarding contract terms and pricing');
  const [bodySnippet, setBodySnippet] = useState('We reviewed the proposal. Can you clarify the SLA support tiers and implementation kickoff schedule?');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [emailList, dealList] = await Promise.all([
      fetchEmails(),
      fetchDeals()
    ]);
    setEmails(emailList);
    setDeals(dealList);
    if (dealList.length > 0 && selectedDealId === '') {
      setSelectedDealId(dealList[0].id);
      setFromEmail(dealList[0].email || 'client@enterprise.com');
    }
  }

  async function handleSimulateEmail(e: React.FormEvent) {
    e.preventDefault();
    setIsSimulating(true);
    try {
      await simulateInboundEmail({
        dealId: selectedDealId !== '' ? Number(selectedDealId) : undefined,
        from: fromEmail,
        subject,
        bodySnippet
      });

      setSubject('');
      setBodySnippet('');
      await loadData();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert('Email simulation failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail style={{ color: 'var(--accent-cyan)', width: 28, height: 28 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>IMAP Inbound Mail Listener & Two-Way Sync</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            MailKit & MimeKit Background Engine • Automatic Deal-to-Email Thread Association
          </p>
        </div>

        <button onClick={loadData} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Sync Inbox
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Email Simulation Simulator */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send style={{ width: 18, height: 18, color: 'var(--accent-cyan)' }} />
            Simulate Inbound Customer Email (IMAP Protocol)
          </h2>

          <form onSubmit={handleSimulateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Associate with Active Deal:
              </label>
              <select
                value={selectedDealId}
                onChange={e => {
                  const dId = Number(e.target.value);
                  setSelectedDealId(dId);
                  const d = deals.find(x => x.id === dId);
                  if (d?.email) setFromEmail(d.email);
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
              >
                {deals.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#0f172a' }}>
                    [{d.stage}] {d.companyName} - {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Sender From Address:
              </label>
              <input
                type="email"
                required
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Email Subject:
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Message Snippet / Body:
              </label>
              <textarea
                rows={3}
                required
                value={bodySnippet}
                onChange={e => setBodySnippet(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '6px' }}
            >
              {isSimulating ? 'Processing via MailKit...' : 'Receive Inbound Email & Sync Deal Thread'}
            </button>
          </form>
        </div>

        {/* Inbound Emails Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox style={{ width: 18, height: 18, color: 'var(--accent-emerald)' }} />
            Received Inbound Customer Communications ({emails.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
            {emails.map(email => (
              <div key={email.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{email.subject}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  From: <strong>{email.from}</strong>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  {email.bodySnippet}
                </p>

                {email.dealId && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 style={{ width: 12, height: 12 }} /> Linked to Deal ID #{email.dealId}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
