/**
 * The extension icon, drawn small: a message with a line blacked out, behind a
 * shield. Fixed colours, so it matches the icon in the toolbar on both themes.
 */
export function Mark({ size = 18 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true">
      <rect width="128" height="128" rx="24" fill="#18212B" />
      <path
        fill="#E6EAEF"
        d="M26 20h56a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H50L32 90V74h-6a10 10 0 0 1-10-10V30a10 10 0 0 1 10-10Z"
      />
      <rect x="34" y="38" width="44" height="14" rx="3" fill="#18212B" />
      <path fill="#18212B" d="M86 50l34 13v26c0 22-15 33-34 41-19-8-34-19-34-41V63z" />
      <path fill="#FFE36E" d="M86 60l26 10v20c0 16-11 25-26 31-15-6-26-15-26-31V70z" />
      <rect x="72" y="84" width="28" height="11" rx="2" fill="#18212B" />
    </svg>
  );
}
