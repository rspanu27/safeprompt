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
      <path fill="#18212B" d="M86 50l32 12v22c0 19-13 29-32 36-19-7-32-17-32-36V62z" />
      <path fill="#FFE36E" d="M86 60l24 9v17c0 14-10 21-24 26-14-5-24-12-24-26V69z" />
      <rect x="73" y="76" width="26" height="10" rx="2" fill="#18212B" />
    </svg>
  );
}
