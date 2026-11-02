import React from 'react';

const TONES2 = {
  blue: { bg: '#e9edfd', fg: '#4a5cf0' },
  green: { bg: '#e4f7ec', fg: '#20a35a' },
  amber: { bg: '#fdf1de', fg: '#e0942f' },
};

const TONES = {
  blue: { bg: '#eee9ff', fg: '#5a3df5' },
  green: { bg: '#e5f7ed', fg: '#208653' },
  amber: { bg: '#fff3df', fg: '#b87513' },
};

export default function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const { bg, fg } = TONES[tone] ?? TONES.blue;

  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color: fg }}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  );
}
