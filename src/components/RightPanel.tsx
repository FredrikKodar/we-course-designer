import type { ReactNode } from 'react';
import PropertiesPanel from './PropertiesPanel';
import SequenceList from './SequenceList';
import CompliancePanel from './CompliancePanel';

interface SectionProps {
  label: string;
  children: ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="p-2.5 border-b border-gray-100 last:border-b-0">
      <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function RightPanel() {
  return (
    <div className="w-[172px] border-l border-gray-200 flex flex-col shrink-0 bg-white overflow-y-auto">
      <Section label="Properties">
        <PropertiesPanel />
      </Section>
      <Section label="Sequence — drag to reorder">
        <SequenceList />
      </Section>
      <Section label="Compliance">
        <CompliancePanel />
      </Section>
    </div>
  );
}
