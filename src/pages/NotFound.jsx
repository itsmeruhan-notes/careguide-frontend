import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Shell from '../Shell.jsx';

function Body({ message }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-xl flex flex-col items-center justify-center min-h-[calc(100vh-120px)] relative">
        <div className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-full max-w-[640px] flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm mb-space-lg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span className="tracking-wide">HTTP 404 · RESOURCE_NOT_FOUND</span>
          </div>
          <div className="relative mb-space-lg">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest shadow-md flex items-center justify-center text-primary relative z-10">
              <span className="material-symbols-outlined text-[40px]">description</span>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-surface-container-low shadow-sm flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">priority_high</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-primary-container/10 rounded-2xl blur-md -z-0"></div>
          </div>
          <div className="flex items-center justify-center gap-space-xs mb-space-xs flex-wrap">
            <span className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">404</span>
            <span className="text-outline-variant font-body-lg text-body-lg">/</span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Page not found</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[520px] mb-space-xl text-center">
            {message || "This page doesn't exist, or you may not have permission to view it. If you were looking for a shared note, check with the owner to verify access."}
          </p>
          <div className="w-full text-left bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-xl flex items-start gap-space-md">
            <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-headline-sm text-headline-sm text-on-surface mb-0.5">Looking for a private note?</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Notes are private by default. Ask the note owner to grant you <span className="font-label-md text-label-md text-on-surface font-semibold">Read</span> or <span className="font-label-md text-label-md text-on-surface font-semibold">Edit</span> access from the Share panel.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-md w-full justify-center">
            <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm h-11 px-space-xl bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm transition-colors" to="/home">
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Go to My Notes</span>
            </Link>
            <button onClick={() => navigate(-1)} className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm h-11 px-space-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg shadow-sm transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_back</span>
              <span>Back to previous page</span>
            </button>
          </div>
          <div className="flex items-center gap-space-lg mt-space-xl pt-space-lg flex-wrap justify-center">
            <a className="inline-flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="https://ruhan.bd" target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined text-[15px]">support_agent</span>
              <span>Contact Ruhan</span>
            </a>
            <span className="text-outline-variant font-label-sm">•</span>
            <button onClick={() => (navigator.clipboard?.writeText(window.location.href), setCopied(true))} className="inline-flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" type="button">
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound({ inShell, message }) {
  const { user } = useAuth();
  if (inShell) return <Body message={message} />;
  if (user) return <Shell><Body message={message} /></Shell>;
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <Body message={message} />
    </div>
  );
}
