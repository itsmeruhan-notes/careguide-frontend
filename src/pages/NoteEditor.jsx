import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { timeAgo } from '../util.js';
import { ErrorBanner, Skeleton, useToast } from '../ui.jsx';
import { Forbidden } from './Errors.jsx';
import NotFound from './NotFound.jsx';

const MAX = 20000;

const TOOLS = [
  ['format_bold', 'Bold (⌘B)', '**', '**'],
  ['format_italic', 'Italic (⌘I)', '*', '*'],
  ['code', 'Inline Code', '`', '`'],
  '|',
  ['format_list_bulleted', 'Bulleted List', '- ', '', true],
  ['format_list_numbered', 'Numbered List', '1. ', '', true],
  ['format_quote', 'Blockquote', '> ', '', true],
  '|',
  ['H1', 'Heading 1', '# ', '', true],
  ['H2', 'Heading 2', '## ', '', true],
  ['horizontal_rule', 'Horizontal Rule', '\n---\n', '', false],
];

export default function NoteEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const area = useRef(null);
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api(`/notes/${id}`)
      .then(({ note: n }) => {
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setSaved({ title: n.title, content: n.content });
      })
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const dirty = title !== saved.title || content !== saved.content;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Discard unsaved changes?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    const onUnload = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    if (!title.trim()) {
      setTitleError('Give your note a title');
      return;
    }
    if (content.length > MAX || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body = { title: title.trim(), content };
      const r = isNew ? await api('/notes', { method: 'POST', body }) : await api(`/notes/${id}`, { method: 'PATCH', body });
      setSaved({ title: body.title, content });
      setLeaving(true);
      toast('Note saved');
      navigate(`/notes/${r.note.id}`, { replace: isNew });
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }, [title, content, isNew, id, saving, navigate, toast]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const apply = ([, , before, after, line]) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    let next;
    let cursor;
    if (line) {
      const start = content.lastIndexOf('\n', s - 1) + 1;
      next = content.slice(0, start) + before + content.slice(start);
      cursor = e + before.length;
    } else {
      next = content.slice(0, s) + before + content.slice(s, e) + after + content.slice(e);
      cursor = e + before.length;
    }
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  if (loadError) return loadError.status === 404 ? <NotFound inShell /> : <div className="max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-lg"><ErrorBanner error={loadError} /></div>;
  if (note && !['owner', 'write'].includes(note.access)) return <Forbidden inShell message="You have read-only access to this note." />;

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const sharedEditor = note && note.access === 'write';
  const over = content.length > MAX;

  return (
    <div className="max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-lg">
      <div className="flex flex-col w-full">
        <div className="w-full flex items-center justify-between mb-4">
          <Link className="inline-flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" to={isNew ? '/home' : `/notes/${id}`}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{isNew ? 'Back to notes' : 'Back to note'}</span>
          </Link>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-primary animate-spin">sync</span>
                  <span>Saving changes...</span>
                </>
              ) : dirty ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                  <span>Unsaved changes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] text-[#16A34A]">check_circle</span>
                  <span>{isNew ? 'New note' : `Saved · ${timeAgo(note?.updatedAt)}`}</span>
                </>
              )}
            </div>
            {note && (
              <>
                <div className="h-4 w-[1px] bg-surface-container-high hidden sm:block"></div>
                <span className="hidden sm:inline-flex items-center gap-1 font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                  <span>rev {note.revision}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[600px]" />
        ) : (
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-6 sm:p-8 relative">
            {sharedEditor && (
              <div className="w-full bg-primary-fixed/30 text-on-primary-fixed-variant rounded-lg p-3 mb-6 flex items-center justify-between text-body-sm font-body-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                  <span>You are editing <strong>{note.owner.name}'s</strong> note (shared with edit access)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  <span className="font-label-sm text-label-sm hidden md:inline">{note.sharedWith.length + 1} collaborators</span>
                </div>
              </div>
            )}
            {error && <div className="mb-6"><ErrorBanner error={error} /></div>}
            <div className="w-full mb-2">
              <input
                value={title}
                onChange={(e) => (setTitle(e.target.value), setTitleError(''))}
                maxLength={120}
                autoFocus={isNew}
                className="w-full bg-transparent font-headline-lg text-headline-lg text-on-surface placeholder:text-outline font-semibold focus:outline-none p-0 tracking-tight"
                id="note-title"
                placeholder="Untitled note"
                type="text"
              />
              {titleError && (
                <div className="flex items-center gap-1.5 text-error mt-1">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  <span className="font-body-sm text-body-sm">{titleError}</span>
                </div>
              )}
            </div>
            <div className="w-full h-[1px] bg-surface-container-high my-4"></div>
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-2">
              <div className="flex items-center gap-0.5 bg-surface-container-low/70 p-1 rounded-lg flex-wrap">
                {TOOLS.map((t, i) =>
                  t === '|' ? (
                    <div key={i} className="w-[1px] h-4 bg-outline-variant/50 mx-1"></div>
                  ) : (
                    <button key={t[1]} onClick={() => apply(t)} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors" title={t[1]} type="button">
                      {t[0].startsWith('H') && t[0].length === 2 ? (
                        <span className={`font-headline-sm text-headline-sm leading-none ${t[0] === 'H1' ? 'font-bold' : 'font-semibold'}`}>{t[0]}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">{t[0]}</span>
                      )}
                    </button>
                  ),
                )}
              </div>
              <div className="hidden md:flex items-center gap-space-sm text-on-surface-variant">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Markdown Enabled</span>
                <span className="material-symbols-outlined text-[18px] p-1">tune</span>
              </div>
            </div>
            <div className="w-full relative">
              <textarea
                ref={area}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[420px] bg-transparent font-body-lg text-body-lg text-on-surface leading-relaxed resize-none focus:outline-none p-0 placeholder:text-outline/70 selection:bg-primary-fixed"
                id="note-body"
                placeholder="Start drafting... Markdown is supported."
                rows="16"
              ></textarea>
            </div>
            <div className="w-full pt-4 mt-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  {sharedEditor ? `Shared · by ${note.owner.name}` : note?.sharedWith?.length ? `Personal · shared with ${note.sharedWith.length}` : 'Personal · Private'}
                </span>
              </div>
              <div className="flex items-center gap-4 font-code-sm text-code-sm text-outline">
                <span className={over ? 'text-error' : ''}>{content.length.toLocaleString()} / 20,000 characters</span>
                <span className="text-surface-container-high">•</span>
                <span>{words} words</span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between mt-4 pb-8 flex-wrap gap-3">
          <div className="flex items-center gap-2 font-body-sm text-body-sm text-outline">
            <span className="material-symbols-outlined text-[16px]">keyboard</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-code-sm text-code-sm">⌘S</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-code-sm text-code-sm">Ctrl+S</kbd> to save anytime
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-colors shadow-sm" to={isNew ? '/home' : `/notes/${id}`}>
              Cancel
            </Link>
            <button onClick={save} disabled={saving || over || loading} className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-label-md text-label-md text-on-primary bg-primary-container hover:bg-primary transition-all shadow-sm active:scale-[0.98] disabled:opacity-60" type="button">
              <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>{saving ? 'progress_activity' : 'save'}</span>
              <span>Save note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
