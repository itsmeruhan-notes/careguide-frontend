import { useEffect } from 'react';
import { avatarColor, initials } from './util.js';

export function Icon({ name, className = 'text-[18px]', fill = false }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>
      {name}
    </span>
  );
}

export function Avatar({ name, className = 'h-5 w-5 font-code-sm text-[10px]' }) {
  return <span className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${avatarColor(name)} ${className}`}>{initials(name)}</span>;
}

const pageList = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

export function Pagination({ data, onPage, onLimit, noun = 'items', limits = [6, 9, 12, 24] }) {
  if (!data) return null;
  const { page, limit, total, totalPages } = data;
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);
  const navBtn = 'h-8 px-2.5 rounded-lg bg-surface-container-lowest font-label-md text-label-md flex items-center gap-1';
  const on = 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low shadow-sm transition-colors';
  const off = 'text-outline cursor-not-allowed';
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-xl pt-space-md border-t border-outline-variant/30">
      <div className="font-body-sm text-body-sm text-on-surface-variant">
        Showing <span className="font-medium text-on-surface">{from}–{to}</span> of <span className="font-medium text-on-surface">{total}</span> {noun}
      </div>
      <nav className="flex items-center gap-1.5">
        <button className={`${navBtn} ${page > 1 ? on : off}`} disabled={page <= 1} onClick={() => onPage(page - 1)} type="button">
          <Icon name="chevron_left" className="text-[16px]" />
          <span>Prev</span>
        </button>
        <div className="flex items-center gap-1">
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-outline font-label-md text-label-md">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={
                  p === page
                    ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-sm'
                    : 'w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-label-md text-label-md flex items-center justify-center transition-colors'
                }
                type="button"
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button className={`${navBtn} ${page < totalPages ? on : off}`} disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button">
          <span>Next</span>
          <Icon name="chevron_right" className="text-[16px]" />
        </button>
      </nav>
      {onLimit ? (
        <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span>Per page:</span>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => onLimit(Number(e.target.value))}
              className="appearance-none h-8 pl-2.5 pr-7 bg-surface-container-lowest text-on-surface rounded-lg shadow-sm font-label-sm text-label-sm hover:bg-surface-container-low transition-colors focus:outline-none"
            >
              {limits.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <Icon name="expand_more" className="text-[14px] text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      ) : (
        <div />
      )}
    </footer>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="p-space-md rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm">
      <Icon name="error" className="text-[20px] text-error" />
      <span className="font-body-sm text-body-sm">{error.message || String(error)}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-auto font-label-md text-label-md underline" type="button">
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-space-lg bg-surface-container-lowest rounded-xl shadow-sm">
      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-space-md">
        <Icon name={icon} className="text-[24px] text-primary-container" />
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs max-w-sm">{hint}</p>
      {action && <div className="mt-space-lg">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = 'h-40' }) {
  return <div className={`animate-pulse rounded-xl bg-surface-container-low ${className}`} />;
}

export function Overlay({ onClose, children, align = 'center' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const pos = align === 'right' ? 'justify-end' : 'items-end sm:items-center justify-center p-0 sm:p-gutter';
  return (
    <div className={`fixed inset-0 z-[60] flex ${pos} bg-inverse-surface/40 backdrop-blur-[2px]`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      {children}
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = 'Delete', busy, error, onCancel, onConfirm }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="w-full sm:max-w-[440px] bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-space-xl">
        <div className="flex items-start gap-space-md">
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-[22px] text-error" />
          </div>
          <div className="flex-1">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">{body}</p>
          </div>
        </div>
        {error && <div className="mt-space-md"><ErrorBanner error={error} /></div>}
        <div className="flex justify-end gap-space-sm mt-space-xl">
          <button onClick={onCancel} className="h-9 px-space-md rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low" type="button">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="h-9 px-space-md rounded-lg bg-error text-on-error font-label-md text-label-md hover:opacity-90 disabled:opacity-60 flex items-center gap-space-xs" type="button">
            {busy && <Icon name="progress_activity" className="text-[16px] animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function useToast() {
  return (message, type = 'success') => window.dispatchEvent(new CustomEvent('rn:toast', { detail: { message, type } }));
}
