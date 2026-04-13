import { useState } from 'react';
import type { ReactNode } from 'react';
import PropertiesPanel from './PropertiesPanel';
import SequenceList from './SequenceList';
import CompliancePanel from './CompliancePanel';
import EventMetaForm from './EventMetaForm';
import ClassesPanel from './ClassesPanel';

type Tab = 'sequence' | 'classes';

interface SectionProps {
  label: string;
  children: ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="p-2.5 border-b border-gray-100 last:border-b-0">
      <div className="text-[9px] tracking-widest uppercase text-gray-600 font-mono mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function RightPanel() {
  const [tab, setTab] = useState<Tab>('sequence');

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`flex-1 text-[11px] py-1.5 border-b-2 transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 ${
        tab === t
          ? 'border-[#BA7517] text-[#BA7517] font-medium'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-[172px] border-l border-gray-200 flex flex-col shrink-0 bg-white overflow-y-auto">
      {/* Tab header */}
      <div className="flex border-b border-gray-200 shrink-0">
        {tabBtn('sequence', 'Sekvens')}
        {tabBtn('classes', 'Klasser')}
      </div>

      {tab === 'sequence' && (
        <>
          <Section label="Tävling">
            <EventMetaForm />
          </Section>
          <Section label="Egenskaper">
            <PropertiesPanel />
          </Section>
          <Section label="Sekvens — dra för att ordna">
            <SequenceList />
          </Section>
          <Section label="Kontroll">
            <CompliancePanel />
          </Section>
        </>
      )}

      {tab === 'classes' && (
        <div className="p-2.5">
          <ClassesPanel />
        </div>
      )}
    </div>
  );
}
