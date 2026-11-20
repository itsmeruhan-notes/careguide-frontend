const inline = (text, key = 'i') => {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<span key={`${key}${n++}`} className="font-semibold text-on-surface">{t.slice(2, -2)}</span>);
    else if (t.startsWith('`')) out.push(<code key={`${key}${n++}`} className="px-1 py-0.5 rounded bg-surface-container font-code-sm text-code-sm text-on-surface">{t.slice(1, -1)}</code>);
    else out.push(<em key={`${key}${n++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const parse = (src) => {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', lang, text: body.join('\n') });
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ type: `h${h[1].length}`, text: h[2] });
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }
    if (/^\s*-\s\[( |x|X)\]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s\[( |x|X)\]\s/.test(lines[i])) {
        const mm = lines[i].match(/^\s*-\s\[( |x|X)\]\s(.*)$/);
        items.push({ done: mm[1] !== ' ', text: mm[2] });
        i++;
      }
      blocks.push({ type: 'tasks', items });
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\.\s/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i]) && !/^\s*-\s\[( |x|X)\]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s/, ''));
        i++;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (line.startsWith('>')) {
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) body.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ type: 'quote', text: body.join(' ') });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\s*([-*]|\d+\.)\s|\s*-{3,}\s*$)/.test(lines[i])) para.push(lines[i++]);
    blocks.push({ type: 'p', lines: para });
  }
  return blocks;
};

export const wordCount = (s = '') => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function Markdown({ source }) {
  const blocks = parse(source || '');
  if (!blocks.length) return <p className="text-on-surface-variant italic">This note is empty.</p>;
  return (
    <div className="space-y-4 text-on-surface font-body-md text-body-md">
      {blocks.map((b, k) => {
        switch (b.type) {
          case 'h1':
            return <h2 key={k} className="font-headline-md text-headline-md text-on-surface pt-2">{inline(b.text, k)}</h2>;
          case 'h2':
            return <h3 key={k} className="font-headline-sm text-headline-sm text-on-surface pt-1">{inline(b.text, k)}</h3>;
          case 'h3':
            return <h4 key={k} className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{inline(b.text, k)}</h4>;
          case 'hr':
            return <div key={k} className="w-full h-px bg-surface-container-high"></div>;
          case 'code':
            return (
              <div key={k} className="rounded-lg bg-inverse-surface text-inverse-on-surface p-4 font-code-md text-code-md overflow-x-auto shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline/30 text-outline-variant font-label-sm">
                  <span>{b.lang || 'code'}</span>
                  <span className="text-primary-fixed-dim">snippet</span>
                </div>
                <pre className="leading-relaxed whitespace-pre"><code>{b.text}</code></pre>
              </div>
            );
          case 'quote':
            return (
              <div key={k} className="p-3.5 rounded-lg bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">format_quote</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{inline(b.text, k)}</p>
              </div>
            );
          case 'tasks':
            return (
              <div key={k} className="space-y-2">
                {b.items.map((t, j) => (
                  <label key={j} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface transition-colors">
                    <input checked={t.done} readOnly className="w-4 h-4 rounded accent-primary-container" type="checkbox" />
                    <span className={`font-body-md text-body-md flex-1 ${t.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{inline(t.text, `${k}-${j}`)}</span>
                    {t.done && <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">Done</span>}
                  </label>
                ))}
              </div>
            );
          case 'ul':
          case 'ol':
            return (
              <ul key={k} className="space-y-1.5 pl-1">
                {b.items.map((t, j) => (
                  <li key={j} className="flex items-start gap-3 p-1.5 rounded-md hover:bg-surface-container-low transition-colors">
                    {b.type === 'ol' ? (
                      <span className="font-code-sm text-code-sm text-primary mt-0.5 w-[18px] text-right shrink-0">{j + 1}.</span>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">chevron_right</span>
                    )}
                    <span className="text-on-surface-variant leading-relaxed">{inline(t, `${k}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={k} className="text-on-surface-variant leading-relaxed">
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {inline(l, `${k}-${j}`)}
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
