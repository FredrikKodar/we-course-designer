import useStore from '../store/useStore';

export default function EventMetaForm() {
  const eventMeta = useStore((s) => s.eventMeta);
  const updateEventMeta = useStore((s) => s.updateEventMeta);

  const textField = (key: 'venue' | 'judge' | 'courseBuilder', label: string) => (
    <div key={key} className="flex flex-col gap-0.5">
      <span className="text-[9px] text-gray-400">{label}</span>
      <input
        type="text"
        value={eventMeta[key]}
        onChange={(e) => updateEventMeta({ [key]: e.target.value })}
        className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-[#f9f9f7] focus:outline-none focus:border-[#BA7517]"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {textField('venue', 'Tävlingsplats')}
      {textField('judge', 'Domare')}
      {textField('courseBuilder', 'Banbyggare')}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] text-gray-400">Datum</span>
        <input
          type="date"
          value={eventMeta.date}
          onChange={(e) => updateEventMeta({ date: e.target.value })}
          className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-[#f9f9f7] focus:outline-none focus:border-[#BA7517]"
        />
      </div>
    </div>
  );
}
