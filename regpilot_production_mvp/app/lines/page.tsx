'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';
import type { RegulatoryLine } from '@/lib/types';

export default function LinesPage() {
  const [lines, setLines] = useState<RegulatoryLine[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('regulatory_lines').select('*').order('category');
      setLines((data || []) as RegulatoryLine[]);
    }
    load();
  }, []);

  const grouped = lines.reduce<Record<string, RegulatoryLine[]>>((acc, line) => {
    acc[line.category] = acc[line.category] || [];
    acc[line.category].push(line);
    return acc;
  }, {});

  return (
    <AppShell title="Regulatory Lines" subtitle="The starting compliance universe for Nigerian upstream E&P companies.">
      <div className="grid">
        {Object.entries(grouped).map(([category, items]) => (
          <div className="card" key={category}>
            <h2>{category}</h2>
            <table className="table">
              <thead><tr><th>Code</th><th>Line</th><th>Regulator</th><th>Default owner</th></tr></thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.id}>
                    <td><span className="badge blue">{line.code}</span></td>
                    <td><strong>{line.name}</strong></td>
                    <td>{line.regulator}</td>
                    <td>{line.default_owner_department || 'Regulatory Manager assigns'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
