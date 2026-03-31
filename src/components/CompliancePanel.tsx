import useStore from '../store/useStore';

export default function CompliancePanel() {
  const placed = useStore((s) => s.placed);
  const violations = useStore((s) => s.violations);

  if (!placed.length) {
    return <div className="text-gray-300 text-[11px]">No obstacles placed</div>;
  }

  const spacingOk = ![...violations.values()].some((msg) => msg.includes('avstånd') || msg.includes('pinnavstånd'));
  const boundsOk = ![...violations.values()].some((msg) => msg.includes('utanför'));
  const spacingCount = [...violations.values()].filter(
    (msg) => msg.includes('avstånd') || msg.includes('pinnavstånd')
  ).length;

  return (
    <div className="flex flex-col gap-0.5">
      <ComplianceItem
        ok={spacingOk}
        text={spacingOk ? 'Spacing OK' : `${spacingCount} spacing issue(s)`}
      />
      <ComplianceItem
        ok={boundsOk}
        text={boundsOk ? 'All within arena' : 'Obstacle out of bounds'}
      />
      <ComplianceItem ok={true} text={`${placed.length} obstacle(s)`} />
    </div>
  );
}

interface ComplianceItemProps {
  ok: boolean;
  text: string;
}

function ComplianceItem({ ok, text }: ComplianceItemProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[10px] ${
        ok
          ? 'bg-[#f0f8ea] border-[#b8dda0] text-[#3B6D11]'
          : 'bg-[#fef0ee] border-[#f5b8b0] text-[#A32D2D]'
      }`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-[#3B6D11]' : 'bg-[#E24B4A]'}`}
      />
      {text}
    </div>
  );
}
