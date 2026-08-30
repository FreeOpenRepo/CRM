'use client';

import React, { useState, useEffect } from 'react';
import { ForecastStats, Deal } from '@/lib/types';
import { fetchForecast, fetchDeals } from '@/lib/api';
import { TrendingUp, PieChart, BarChart3, DollarSign, Award, AlertTriangle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SalesManagerView() {
  const [stats, setStats] = useState<ForecastStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [forecastData, dealList] = await Promise.all([
        fetchForecast(),
        fetchDeals()
      ]);
      setStats(forecastData);
      setDeals(dealList);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: 'var(--accent-cyan)', width: 28, height: 28 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Executive Sales Forecast & Analytics</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Probability-weighted pipeline • Win rate percentage • Loss reason telemetry
          </p>
        </div>

        <button onClick={loadData} disabled={isLoading} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw style={{ width: 14, height: 14, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Forecast
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Closed Won Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)' }} className="font-mono">
              {stats.closedWonValue.toLocaleString()} ฿
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Finalized contracts
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Weighted Pipeline Forecast</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }} className="font-mono">
              {Math.round(stats.weightedForecastValue).toLocaleString()} ฿
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Probability-adjusted active deals
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ยอดรวม Active Pipeline</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }} className="font-mono">
              {stats.totalPipelineValue.toLocaleString()} ฿
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Across {stats.activeDealsCount} active opportunities
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Team Win Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)' }} className="font-mono">
              {stats.winRatePercentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Won vs. Lost conversions
            </div>
          </div>
        </div>
      )}

      {/* Grid: Loss Reasons Breakdown & Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Loss Reasons Breakdown */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ width: 18, height: 18, color: 'var(--accent-rose)' }} />
            Deal Loss Reasons Breakdown (Invariant Telemetry)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats?.lossReasons && stats.lossReasons.length > 0 ? (
              stats.lossReasons.map(item => (
                <div key={item.reason} style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fda4af' }}>{item.reason}</span>
                  <span className="font-mono" style={{ fontWeight: 800, background: 'rgba(244,63,94,0.2)', color: 'var(--accent-rose)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {item.count} Deals
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No lost deals recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Rep Leaderboard */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award style={{ width: 18, height: 18, color: 'var(--accent-amber)' }} />
            Sales Rep Performance & Workload
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Alex Mercer', 'Sarah Jenkins'].map((rep, idx) => {
              const repDeals = deals.filter(d => d.ownerName.includes(rep));
              const wonยอดรวม = repDeals.filter(d => d.stage === 'WON').reduce((s, d) => s + d.dealValue, 0);
              const pipelineยอดรวม = repDeals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST').reduce((s, d) => s + d.dealValue, 0);

              return (
                <div key={rep} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rep}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700 }} className="font-mono">
                      Won: {wonยอดรวม.toLocaleString()} ฿
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Active Pipeline: {pipelineยอดรวม.toLocaleString()} ฿</span>
                    <span>{repDeals.length} ยอดรวม Opportunities</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

