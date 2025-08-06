import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnsavedChanges } from 'Frontend/hooks/useUnsavedChanges';

function createAnchor(href = '/internal-page') { // Fixed: use relative URL for internal link
  const link = document.createElement('a');
  link.href = href;
  link.textContent = 'Go somewhere';
  document.body.appendChild(link);
  return link;
}

describe('useUnsavedChanges', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should add and remove the click listener with capture', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const onNav = vi.fn();

    const { unmount } = renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    // Filter for click events only (React Testing Library may add other listeners)
    const clickAddCalls = addSpy.mock.calls.filter(call => call[0] === 'click');
    expect(clickAddCalls).toHaveLength(1);
    expect(clickAddCalls[0]).toEqual(['click', expect.any(Function), true]);

    unmount();
    
    const clickRemoveCalls = removeSpy.mock.calls.filter(call => call[0] === 'click');
    expect(clickRemoveCalls).toHaveLength(1);
    expect(clickRemoveCalls[0]).toEqual(['click', expect.any(Function), true]);
  });

  it('should intercept clicks on <a> when hasChanges = true and isSubmitted = false', () => {
    const onNav = vi.fn();
    const link = createAnchor();

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');
    vi.spyOn(event, 'stopPropagation');

    link.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onNav).toHaveBeenCalledWith(link.href);
  });

  it('should not intercept when isSubmitted = true', () => {
    const onNav = vi.fn();
    const link = createAnchor();

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: true, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');
    vi.spyOn(event, 'stopPropagation');

    link.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onNav).not.toHaveBeenCalled();
  });

  it('should handle clicks on child elements inside <a>', () => {
    const onNav = vi.fn();
    const link = createAnchor();
    const child = document.createElement('span');
    link.appendChild(child);

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');
    vi.spyOn(event, 'stopPropagation');

    child.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onNav).toHaveBeenCalledWith(link.href);
  });

  it('should respect prop changes to hasChanges and isSubmitted', async () => {
    const onNav = vi.fn();
    const link = createAnchor();

    const { rerender } = renderHook(
      (props) => useUnsavedChanges(props),
      {
        initialProps: {
          hasChanges: false,
          isSubmitted: false,
          onNavigationAttempt: onNav,
        },
      }
    );

    // Test with no changes
    let event = new MouseEvent('click', { bubbles: true, cancelable: true });
    let preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    link.dispatchEvent(event);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(onNav).not.toHaveBeenCalled();

    // Set changes and rerun
    rerender({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav });

    // Create new event for second test
    event = new MouseEvent('click', { bubbles: true, cancelable: true });
    preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    link.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onNav).toHaveBeenCalledWith(link.href);
  });

  it('should not intercept external links', () => {
    const onNav = vi.fn();
    const externalLink = createAnchor('https://external-site.com/page');

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');

    externalLink.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onNav).not.toHaveBeenCalled();
  });

  it('should not intercept links with target="_blank"', () => {
    const onNav = vi.fn();
    const link = createAnchor();
    link.target = '_blank';

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');

    link.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onNav).not.toHaveBeenCalled();
  });

  it('should not intercept javascript: links', () => {
    const onNav = vi.fn();
    const jsLink = createAnchor('javascript:void(0)');

    renderHook(() =>
      useUnsavedChanges({ hasChanges: true, isSubmitted: false, onNavigationAttempt: onNav })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    vi.spyOn(event, 'preventDefault');

    jsLink.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onNav).not.toHaveBeenCalled();
  });
});