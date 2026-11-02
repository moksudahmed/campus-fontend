import React from 'react';
import { BookOpen, CalendarDays, MessageSquare } from 'lucide-react';
import StatCard from './StatCard';
import logo from '../assets/MU.jpg';

export default function Dashboard({ stats, student }) {
  const iconFor = {
    courses: BookOpen,
    events: CalendarDays,
    messages: MessageSquare,
  };
  const toneFor = {
    courses: 'blue',
    events: 'green',
    messages: 'amber',
  };
  
  return (
    <div className="panel">
      <div className="stat-grid">
        {stats.map((s) => (
          <StatCard
            key={s.key}
            icon={iconFor[s.key]}
            tone={toneFor[s.key]}
            label={s.label}
            value={s.value}
          />
        ))}
      </div>

      <div className="watermark">
        <img src={logo} alt="Metropolitan University" />
      </div>
    </div>
  );
}
