import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { initials, monthYear, timeAgo, useAsync } from '../util.js';
import { ConfirmDialog, ErrorBanner, Skeleton, useToast } from '../ui.jsx';
import NotFound from './NotFound.jsx';

function ProfilePost({ post, canDelete, onDelete }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  return (
    <article id={`post-${post.id}`} className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-space-sm relative">
      <div className="flex items-start justify-between gap-space-sm">
        <button onClick={() => setMore((m) => !m)} className="text-left font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary-container transition-colors leading-snug" type="button">{post.title}</button>
        {canDelete && (
          <div className="relative shrink-0">
            <button onClick={() => setOpen((o) => !o)} aria-label="Post actions" className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-40 py-1 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10">
                <button onClick={() => (setOpen(false), onDelete(post))} className="w-full flex items-center gap-2 px-space-md py-2 font-body-sm text-body-sm text-error hover:bg-error-container/30 text-left" type="button">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line break-words ${more ? '' : 'line-clamp-3'}`}>{post.body}</p>
      <div className="flex items-center justify-between pt-space-xs flex-wrap gap-space-sm">
        <div className="flex items-center gap-space-xs flex-wrap">
          {post.tags.map((t) => (
            <Link key={t} to={`/posts?q=${encodeURIComponent(t)}`} className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-mono hover:text-primary">#{t}</Link>
          ))}
        </div>
        <div className="flex items-center gap-space-md font-body-sm text-body-sm text-outline">
          <button onClick={() => setMore((m) => !m)} className="inline-flex items-center gap-1 hover:text-on-surface transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">{more ? 'unfold_less' : 'unfold_more'}</span>
            <span>{more ? 'Collapse' : 'Expand'}</span>
          </button>
          <span className="text-outline/70">·</span>
          <span className="font-code-sm text-code-sm">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const navigate = useNavigate();
  const toast = useToast();
  const res = useAsync(() => api(`/users/${id}/posts`, { query: { page, limit: 5, sort } }), [id, page, sort]);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  if (res.error?.status === 404) return <NotFound inShell message="This user doesn't exist." />;
  const u = res.data?.user;
  const posts = res.data?.posts;
  const isMe = me && u && me.id === u.id;

  const copy = (text, msg) => {
    navigator.clipboard?.writeText(text);
    toast(msg);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/posts/${toDelete.id}`, { method: 'DELETE' });
      setToDelete(null);
      toast('Post deleted');
      res.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const seg = (on) => `px-2.5 py-1 rounded font-label-sm text-label-sm font-medium transition-colors ${on ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`;

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-sm sticky top-16 z-30">
        <div className="max-w-[760px] mx-auto px-gutter flex items-center justify-between h-12">
          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/posts'))} className="inline-flex items-center gap-space-xs text-on-surface-variant hover:text-primary-container font-label-md text-label-md transition-colors group" type="button">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-space-sm text-on-surface-variant font-code-sm text-code-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-surface-tint/60 animate-pulse"></span>
            <span className="tracking-wide text-outline">user_id: <span className="text-on-surface">{id.slice(-8)}</span></span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[760px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
        {res.error && <ErrorBanner error={res.error} onRetry={res.reload} />}
        {!u ? (
          <Skeleton className="h-56" />
        ) : (
          <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm relative overflow-hidden flex flex-col gap-space-md">
            <div className="absolute right-0 top-0 w-64 h-64 bg-surface-container-low/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-md relative">
              <div className="flex items-start gap-space-md">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-surface-container to-secondary-fixed flex items-center justify-center font-headline-md text-headline-md font-semibold text-secondary shadow-sm">{initials(u.name)}</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-container-lowest flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs min-w-0">
                  <div className="flex items-center flex-wrap gap-space-sm">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">{u.name}</h1>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium ${u.role === 'admin' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                  </div>
                  <p className="font-code-sm text-code-sm text-outline">@{u.name} · {u.name}@ruhan.lol</p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs shrink-0 self-start">
                <button onClick={() => copy(window.location.href, 'Profile link copied')} className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors shadow-sm" type="button">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">share</span>
                  <span>Share</span>
                </button>
                {isMe ? (
                  <Link to="/profile" className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit profile</span>
                  </Link>
                ) : (
                  <button onClick={() => copy(`@${u.name}`, `Copied @${u.name}`)} className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md transition-colors shadow-sm" type="button">
                    <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                    <span>Mention</span>
                  </button>
                )}
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl relative">{u.bio || 'No bio yet.'}</p>
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs relative">
              {u.interests.map((i) => (
                <Link key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors group" to={`/interests?interest=${encodeURIComponent(i)}`}>
                  <span className="text-outline mr-0.5 group-hover:text-primary-container font-mono">#</span>{i}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-space-sm font-body-sm text-body-sm text-on-surface-variant relative">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">work_outline</span>
                <span>{u.role === 'admin' ? 'Administrator' : 'Member'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                <span>Joined {monthYear(u.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">article</span>
                <span className="font-medium text-on-surface">{posts?.total ?? 0} posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-outline">interests</span>
                <span>{u.interests.length} interests</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between flex-wrap gap-space-sm px-1">
            <div className="flex items-center gap-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Posts by {u?.name || '…'}</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">{posts?.total ?? 0}</span>
            </div>
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button onClick={() => setParams({})} className={seg(sort === 'newest')} type="button">Latest</button>
              <button onClick={() => setParams({ sort: 'oldest' })} className={seg(sort === 'oldest')} type="button">Oldest</button>
            </div>
          </div>
          <div className="flex flex-col gap-space-md">
            {res.loading && !posts && <Skeleton className="h-32" />}
            {posts?.data.map((p) => <ProfilePost key={p.id} post={p} canDelete={isMe || me?.role === 'admin'} onDelete={setToDelete} />)}
          </div>
          {posts && !posts.total && (
            <div className="w-full bg-surface-container-lowest rounded-xl p-12 text-center flex flex-col items-center justify-center gap-space-sm shadow-sm">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-space-xs">
                <span className="material-symbols-outlined text-[24px]">edit_note</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">{u?.name} hasn't posted yet</p>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Posts will display here once published.</p>
            </div>
          )}
          {posts?.total > 0 && (
            <div className="w-full bg-surface-container-lowest rounded-xl px-space-md py-space-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-xs">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing <span className="font-medium text-on-surface">{(posts.page - 1) * posts.limit + 1}–{Math.min(posts.total, posts.page * posts.limit)}</span> of <span className="font-medium text-on-surface">{posts.total}</span> posts
              </span>
              <div className="flex items-center gap-space-xs">
                <button onClick={() => setParams({ ...(sort === 'oldest' ? { sort } : {}), page: String(page - 1) })} disabled={page <= 1} className={`px-2.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-0.5 ${page <= 1 ? 'text-outline opacity-40 cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors'}`} type="button">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Prev</span>
                </button>
                {Array.from({ length: posts.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setParams({ ...(sort === 'oldest' ? { sort } : {}), page: String(p) })} className={p === page ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-xs' : 'w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors'} type="button">
                    {p}
                  </button>
                ))}
                <button onClick={() => setParams({ ...(sort === 'oldest' ? { sort } : {}), page: String(page + 1) })} disabled={page >= posts.totalPages} className={`px-2.5 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-0.5 ${page >= posts.totalPages ? 'text-outline opacity-40 cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors'}`} type="button">
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {toDelete && <ConfirmDialog title="Delete post?" body={`'${toDelete.title}' will be removed from the feed.`} busy={busy} onCancel={() => setToDelete(null)} onConfirm={remove} />}
    </div>
  );
}
