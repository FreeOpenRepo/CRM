'use client';

import React, { useState, useEffect } from 'react';
import { ActorRole } from '@/lib/types';
import SalesRepView from '@/components/views/SalesRepView';
import SalesManagerView from '@/components/views/SalesManagerView';
import ImapMailView from '@/components/views/ImapMailView';
import { DollarSign, Kanban, TrendingUp, Mail, Wifi, WifiOff, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeRole, setActiveRole] = useState<ActorRole>('SalesRep');
  const [isApiOnline, setIsApiOnline] = useState<boolean>(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      const res = await fetch('http://localhost:5040/api/health');
      setIsApiOnline(res.ok);
    } catch {
      setIsApiOnline(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation */}
      <header
        style={{
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-glass)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: '12px 24px'
        }}
      >
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              <DollarSign style={{ color: '#000', width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ENTERPRISE <span style={{ color: 'var(--accent-emerald)' }}>CRM</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                08_CRM_ENGINE
              </div>
            </div>
          </div>

          {/* Actor Role Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-glass)',
            padding: '4px',
            borderRadius: '14px',
            gap: '4px'
          }}>
            {[
              { role: 'SalesRep' as const, label: 'Sales Pipeline (Kanban)', icon: Kanban, color: 'var(--accent-cyan)' },
              { role: 'SalesManager' as const, label: 'Sales Forecast & Analytics', icon: TrendingUp, color: 'var(--accent-emerald)' },
              { role: 'ImapMailListener' as const, label: 'IMAP Inbound Mail', icon: Mail, color: 'var(--accent-blue)' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeRole === tab.role;
              return (
                <button
                  key={tab.role}
                  onClick={() => setActiveRole(tab.role)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  <Icon style={{ width: 16, height: 16, color: isActive ? tab.color : 'inherit' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* API Health */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: isApiOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${isApiOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isApiOnline ? '#34d399' : '#fca5a5'
          }}>
            {isApiOnline ? <Wifi style={{ width: 12, height: 12 }} /> : <WifiOff style={{ width: 12, height: 12 }} />}
            <span>{isApiOnline ? 'CRM API Active' : 'Connecting API :5040...'}</span>
          </div>
        </div>
      </header>

      {/* Main View Content */}
      <div style={{ flex: 1, padding: '16px' }}>
        {activeRole === 'SalesRep' && <SalesRepView />}
        {activeRole === 'SalesManager' && <SalesManagerView />}
        {activeRole === 'ImapMailListener' && <ImapMailView />}
      </div>
    </main>
  );
}
