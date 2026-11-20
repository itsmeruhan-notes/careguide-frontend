import { useState } from 'react';

export default function ChipInput({ value, onChange, max = 10, className = 'p-2 min-h-[44px] bg-surface-container-low rounded-lg flex flex-wrap items-center gap-1.5' }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const commit = () => {
    const v = text.trim().replace(/,/g, '').toLowerCase();
    if (v && !value.includes(v) && value.length < max) onChange([...value, v]);
    setText('');
    setEditing(false);
  };
  return (
    <div className={className}>
      {value.map((chip) => (
        <span key={chip} className="inline-flex items-center gap-1 bg-surface-container-lowest text-on-surface px-2.5 py-1 rounded-md font-body-sm text-body-sm shadow-sm group">
          {chip}
          <button onClick={() => onChange(value.filter((c) => c !== chip))} className="text-outline hover:text-error transition-colors flex items-center p-0.5" type="button">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
      ))}
      {value.length < max && (
        <div className="inline-flex items-center">
          {editing ? (
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  setText('');
                  setEditing(false);
                }
              }}
              className="h-7 w-24 px-1.5 bg-surface-container-lowest rounded font-body-sm text-body-sm text-on-surface focus:outline-none"
              placeholder="Tag..."
              type="text"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-2 py-1 text-primary hover:bg-surface-container-highest rounded-md font-label-md text-label-md transition-colors" type="button">
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
