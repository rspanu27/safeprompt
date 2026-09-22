/** The extension icon, drawn small: three lines of text, one blacked out. */
export function Mark({ size = 18 }: { readonly size?: number }) {
  return (
    <svg className="mark" viewBox="0 0 128 128" width={size} height={size} aria-hidden="true">
      <rect width="128" height="128" rx="28" className="mark-tile" />
      <rect x="24" y="28" width="64" height="16" rx="8" className="mark-line" />
      <rect x="24" y="56" width="80" height="20" rx="4" className="mark-bar" />
      <rect x="24" y="88" width="48" height="16" rx="8" className="mark-line" />
    </svg>
  );
}
