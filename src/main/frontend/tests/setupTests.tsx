// Global mock for react-router to preserve MemoryRouter and allow navigation mocking
import React from 'react';
import { vi } from 'vitest';

// Import jest-dom matchers globally
import '@testing-library/jest-dom';

export const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  const real = actual.default ? actual.default : actual;
  return {
    ...real,
    useNavigate: () => mockNavigate,
    Outlet: (props: any) => <div data-testid="outlet" {...props} />,
  };
});

// Polyfill ResizeObserver for jsdom environment (used by Vaadin components)
if (typeof window.ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as any).ResizeObserver = ResizeObserver;
}

// Polyfill CSS.supports for jsdom environment
if (typeof window.CSS === 'undefined') {
  (window as any).CSS = {};
}
if (typeof window.CSS.supports !== 'function') {
  window.CSS.supports = () => true;
}