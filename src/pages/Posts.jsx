import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { initials, timeAgo, useAsync, useDebounced } from '../util.js';
import { ConfirmDialog, Empty, ErrorBanner, Overlay, Skeleton, useToast } from '../ui.jsx';
import { wordCount } from '../Markdown.jsx';

export function PostCard({ post, onDelete, onTag, showAuthor = true }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const ref = useRef(null);
  const toast = useToast();
  const canDelete = user && (post.author.id === user.id || user.role === 'admin');
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const long = post.body.length > 280;
  const copy = () => {
    navigator.clipboard?.writeText(`${window.location.origin}${import.meta.env.BASE_URL}users/${post.author.id}#post-${post.id}`);
    setOpen(false);
    toast('Link copied');
  };
  return (
    <article id={`post-${post.id}`} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col gap-space-md relative group">
      <div className="flex items-center justify-between">
        {showAuthor ? (
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-md text-label-md font-bold tracking-tight shrink-0">{initials(post.author.name)}</div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link className="font-headline-sm text-headline-sm text-on-surface font-semibold hover:text-primary transition-colors" to={`/users/${post.author.id}`}>{post.author.name}</Link>
                <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${post.author.role === 'admin' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>{post.author.role === 'admin' ? 'Admin' : 'User'}</span>
                <span className="text-on-surface-variant font-body-sm text-body-sm">· {timeAgo(post.createdAt)}</span>
              </div>
              <span className="text-on-surface-variant font-body-sm text-body-sm text-[12px] -mt-0.5 truncate">{post.author.name}@ruhan.lol</span>
            </div>
          </div>
        ) : (
          <span className="text-on-surface-variant font-body-sm text-body-sm">{timeAgo(post.createdAt)}</span>
        )}
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((o) => !o)} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-44 py-1 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10">
              <button onClick={copy} className="w-full flex items-center gap-2 px-space-md py-2 font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-left" type="button">
                <span className="material-symbols-outlined text-[16px]">link</span>
                Copy link
              </button>
              {canDelete && (
                <>
                  <div className="my-1 bg-surface-container h-[1px]"></div>
                  <button onClick={() => (setOpen(false), onDelete(post))} className="w-full flex items-center gap-2 px-space-md py-2 font-body-sm text-body-sm text-error hover:bg-error-container/30 text-left" type="button">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 onClick={() => setMore(true)} className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer break-words">{post.title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line break-words">
          {long && !more ? `${post.body.slice(0, 280).trimEnd()}...` : post.body}
          {long && (
            <button onClick={() => setMore((m) => !m)} className="text-primary font-medium hover:underline inline-block ml-1" type="button">{more ? 'Show less' : 'Read more'}</button>
          )}
        </p>
      </div>
      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant gap-space-sm">
        <div className="flex items-center gap-space-xs flex-wrap">
          {post.tags.map((t) => (
            <button key={t} onClick={() => onTag?.(t)} className="px-2.5 py-1 rounded-lg bg-surface-container-low text-primary font-code-sm text-code-sm font-medium hover:bg-surface-container cursor-pointer transition-colors" type="button">#{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-space-md font-body-sm text-body-sm shrink-0">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {Math.max(1, Math.round(wordCount(post.body) / 200))} min read
          </span>
          <button onClick={copy} className="flex items-center gap-1 hover:text-on-surface transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">link</span>
            Copy link
          </button>
        </div>
      </div>
    </article>
  );
}

export function FeedPager({ data, onPage, onLimit, noun = 'posts' }) {
  if (!data || !data.total) return null;
  const { page, limit, total, totalPages } = data;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-sm pb-space-xl">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{(page - 1) * limit + 1}–{Math.min(total, page * limit)}</span> of <span className="font-semibold text-on-surface">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-space-xs flex-wrap">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={`px-2.5 py-1 rounded-lg font-label-md text-label-md flex items-center ${page <= 1 ? 'text-outline cursor-not-allowed opacity-50' : 'text-on-surface-variant hover:bg-surface-container transition-colors'}`} type="button">
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          Prev
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-space-xs">
            {i > 0 && p - pages[i - 1] > 1 && <span className="text-outline px-1">…</span>}
            <button onClick={() => onPage(p)} className={p === page ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-sm' : 'w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md flex items-center justify-center transition-colors'} type="button">{p}</button>
          </span>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={`px-2.5 py-1 rounded-lg font-label-md text-label-md flex items-center ${page >= totalPages ? 'text-outline cursor-not-allowed opacity-50' : 'text-on-surface-variant hover:bg-surface-container transition-colors'}`} type="button">
          Next
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
        {onLimit && (
          <div className="relative inline-flex items-center">
            <label className="sr-only" htmlFor="per-page-select">Items per page</label>
            <select value={limit} onChange={(e) => onLimit(Number(e.target.value))} className="appearance-none bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm py-1.5 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" id="per-page-select">
              {[10, 20, 50].map((l) => <option key={l} value={l}>Per page: {l}</option>)}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 pointer-events-none">expand_more</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewPostModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [tagText, setTagText] = useState('');
  const [adding, setAdding] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const addTag = () => {
    const t = tagText.trim().toLowerCase().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagText('');
    setAdding(false);
  };

  const submit = async () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!body.trim()) errs.body = 'Body is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api('/posts', { method: 'POST', body: { title: title.trim(), body: body.trim(), tags } });
      onCreated();
    } catch (e) {
      setErrors(Object.keys(e.fields).length ? e.fields : { _: e.message });
    } finally {
      setBusy(false);
    }
  };

  const err = (k) => errors[k] && (
    <div className="flex items-center gap-1.5 text-error">
      <span className="material-symbols-outlined text-[15px]">error</span>
      <span className="font-body-sm text-body-sm">{errors[k]}</span>
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-[520px] bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">New post</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={(e) => (e.preventDefault(), submit())} className="p-space-lg flex flex-col gap-space-md overflow-y-auto">
          {err('_')}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md font-medium text-on-surface" htmlFor="post-title-input">Title</label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">max 120 chars</span>
            </div>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner" id="post-title-input" maxLength="120" placeholder="What's on your mind? (max 120 chars)" type="text" />
            {err('title')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-medium text-on-surface">Tags &amp; Topics</label>
            <div className="min-h-10 p-1.5 rounded-lg bg-surface-container-low flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary font-code-sm text-code-sm font-medium shadow-sm">
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t} tag`} className="hover:text-error transition-colors flex items-center" type="button">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
              {tags.length < 5 &&
                (adding ? (
                  <input autoFocus value={tagText} onChange={(e) => setTagText(e.target.value)} onBlur={addTag} onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())} className="h-7 w-24 px-1.5 bg-surface-container-lowest rounded font-code-sm text-code-sm text-on-surface focus:outline-none" placeholder="tag" />
                ) : (
                  <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    add tag
                  </button>
                ))}
            </div>
            {err('tags')}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md font-medium text-on-surface" htmlFor="post-content-area">Content</label>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">markdown</span>
                Plain text
              </span>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner resize-y leading-relaxed" id="post-content-area" placeholder="Write your post..." rows="6"></textarea>
            <div className="flex justify-between pt-1">
              {err('body') || <span />}
              <span className="font-code-sm text-code-sm text-on-surface-variant">{body.length.toLocaleString()} / 5,000 characters</span>
            </div>
          </div>
        </form>
        <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            <span>Posts are visible to all Ruhan's Notes members.</span>
          </div>
          <div className="flex items-center justify-end gap-space-sm">
            <button onClick={onClose} className="px-space-md py-2 rounded-lg font-label-md text-label-md font-medium text-on-surface hover:bg-surface-container transition-colors" type="button">Cancel</button>
            <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary shadow-sm transition-all disabled:opacity-60" type="button">
              <span>{busy ? 'Publishing…' : 'Publish post'}</span>
              <span className={`material-symbols-outlined text-[16px] ${busy ? 'animate-spin' : ''}`}>{busy ? 'progress_activity' : 'arrow_forward'}</span>
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export default function Posts() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 10;
  const [search, setSearch] = useState(params.get('q') || '');
  const q = useDebounced(search.trim());
  const [modal, setModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const feed = useAsync(() => api('/posts', { query: { page, limit, q } }), [page, limit, q]);
  const set = (patch) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v === undefined ? n.delete(k) : n.set(k, String(v))));
    return n;
  });

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/posts/${toDelete.id}`, { method: 'DELETE' });
      toast('Post deleted');
      setToDelete(null);
      feed.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const seg = (on) => `px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${on ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`;

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-xl flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              Feed Live • /posts
            </span>
            <span className="text-on-surface-variant font-body-sm text-body-sm hidden md:inline">Public stream for every member</span>
          </div>
          <div className="flex items-center bg-surface-container p-1 rounded-lg self-start sm:self-auto">
            <button onClick={() => setModal(false)} className={seg(!modal)} type="button">
              <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
              Feed View
            </button>
            <button onClick={() => setModal(true)} className={seg(modal)} type="button">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              New Post
            </button>
          </div>
        </div>

        <div className="w-full max-w-[720px] mx-auto flex flex-col gap-space-xl">
          <div className="flex items-center justify-between pt-space-xs gap-space-md">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Posts</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">What everyone is writing</p>
            </div>
            <button onClick={() => setModal(true)} className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary shadow-sm transition-all hover:shadow shrink-0" type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New post</span>
            </button>
          </div>

          <div className="relative -mt-space-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
            <input value={search} onChange={(e) => (setSearch(e.target.value), page > 1 && set({ page: undefined }))} className="w-full h-9 pl-9 pr-8 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container/20" placeholder="Search posts, #tags or authors..." type="text" />
            {search && (
              <button onClick={() => setSearch('')} className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline hover:text-on-surface" type="button">close</button>
            )}
          </div>

          {feed.error && <ErrorBanner error={feed.error} onRetry={feed.reload} />}
          <div className="flex flex-col gap-space-md -mt-space-sm">
            {feed.loading && !feed.data
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48" />)
              : feed.data?.data.map((p) => <PostCard key={p.id} post={p} onDelete={setToDelete} onTag={(t) => (setSearch(t), set({ page: undefined }))} />)}
            {feed.data && !feed.data.data.length && (
              <Empty icon="dynamic_feed" title={q ? 'No posts match your search' : 'No posts yet'} hint={q ? `Nothing found for "${q}".` : 'Be the first to write one.'} />
            )}
          </div>
          <FeedPager data={feed.data} onPage={(p) => set({ page: p })} onLimit={(l) => set({ limit: l, page: undefined })} />
        </div>
      </div>
      {modal && (
        <NewPostModal
          onClose={() => setModal(false)}
          onCreated={() => {
            setModal(false);
            toast('Post published');
            setSearch('');
            if (page !== 1) set({ page: undefined });
            else feed.reload();
          }}
        />
      )}
      {toDelete && <ConfirmDialog title="Delete post?" body={`'${toDelete.title}' will be removed from the feed.`} busy={busy} onCancel={() => setToDelete(null)} onConfirm={remove} />}
    </div>
  );
}
