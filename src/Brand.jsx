import { useId } from 'react';
import { WORDMARK_CORE, WORDMARK_INK, WORDMARK_VIEWBOX } from './wordmark.js';

export function BrandMark({ size = 'w-8 h-8' }) {
  return <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Ruhan's Notes" className={`${size} rounded-lg shadow-sm shrink-0`} />;
}

export function Wordmark({ className = 'text-[20px]' }) {
  const id = useId();
  return (
    <span className={`font-['Fraunces',serif] font-semibold tracking-tight text-on-surface whitespace-nowrap ${className}`}>
      <svg viewBox={WORDMARK_VIEWBOX} role="img" aria-label="ruhan" style={{ height: '0.95em', width: 'auto', verticalAlign: '-0.13em', display: 'inline-block' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ea580c" />
            <stop offset="0.5" stopColor="#f97316" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path fill="currentColor" d={WORDMARK_INK} />
        <path fill={`url(#${id})`} d={WORDMARK_CORE} />
      </svg>
      <span>'s Notes</span>
    </span>
  );
}

export default function Brand({ size = 'w-8 h-8', text = 'text-[20px]' }) {
  return (
    <span className="flex items-center gap-space-sm">
      <BrandMark size={size} />
      <Wordmark className={text} />
    </span>
  );
}
