/** A `<textarea>`/`<input>`, whose content is a `value` property. */
export interface ValueTarget {
  readonly kind: 'value';
  readonly element: HTMLTextAreaElement | HTMLInputElement;
}

/** A rich-text editor, whose content is DOM managed by its own model. */
export interface EditableTarget {
  readonly kind: 'contenteditable';
  readonly element: HTMLElement;
}

export type PasteTarget = ValueTarget | EditableTarget;

export interface SiteAdapter {
  readonly id: string;
  matches(url: URL): boolean;
  /**
   * The editor this paste is going into, or null to leave the paste alone.
   *
   * Adapters only identify the target. Insertion is shared, because every
   * supported site uses one of the same two mechanisms and pretending otherwise
   * would be three copies of the same code.
   */
  resolveTarget(event: ClipboardEvent): PasteTarget | null;
}
