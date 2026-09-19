import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModalHost } from './host';

describe('createModalHost', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches a host element to the page', () => {
    createModalHost();
    expect(document.getElementById('safeprompt-host')).not.toBeNull();
  });

  it('closes the shadow root against the page', () => {
    createModalHost();

    // A page script that finds our element must not be able to read what is
    // inside it, because the preview shows the user's secrets.
    const host = document.getElementById('safeprompt-host');
    expect(host?.shadowRoot).toBeNull();
  });

  it('keeps the mount point out of the page document', () => {
    const { container } = createModalHost();
    container.textContent = 'secret preview';

    expect(document.body.textContent).not.toContain('secret preview');
    expect(document.querySelector('#safeprompt-host div')).toBeNull();
  });

  it('pins the host above page content and outside its layout', () => {
    createModalHost();
    const host = document.getElementById('safeprompt-host');

    expect(host?.style.getPropertyValue('position')).toBe('fixed');
    expect(host?.style.getPropertyPriority('position')).toBe('important');
    expect(host?.style.getPropertyValue('z-index')).toBe('2147483647');
  });

  it('resets inherited styling so page CSS cannot reach the host', () => {
    createModalHost();
    const host = document.getElementById('safeprompt-host');

    expect(host?.style.getPropertyValue('all')).toBe('initial');
    expect(host?.style.getPropertyPriority('all')).toBe('important');
  });

  it('does not leak interaction events to the page', () => {
    // Every supported site has document-level click analytics. Composed events
    // cross the shadow boundary, so without this the modal fires the page's
    // telemetry on its way past.
    const pageListener = vi.fn();
    document.addEventListener('click', pageListener);
    document.addEventListener('keydown', pageListener);

    const { container } = createModalHost();
    const button = document.createElement('button');
    container.appendChild(button);

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true }));

    expect(pageListener).not.toHaveBeenCalled();

    document.removeEventListener('click', pageListener);
    document.removeEventListener('keydown', pageListener);
  });

  it('still delivers events to our own UI inside the shadow root', () => {
    const ours = vi.fn();
    const { container } = createModalHost();

    const button = document.createElement('button');
    button.addEventListener('click', ours);
    container.appendChild(button);

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect(ours).toHaveBeenCalledOnce();
  });

  it('replaces a previous host rather than stacking a second one', () => {
    createModalHost();
    createModalHost();

    expect(document.querySelectorAll('#safeprompt-host')).toHaveLength(1);
  });

  it('removes itself cleanly', () => {
    const { remove } = createModalHost();
    remove();

    expect(document.getElementById('safeprompt-host')).toBeNull();
  });
});
