import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from 'Frontend/hooks/usePageMeta';

describe('usePageMeta', () => {
  let originalTitle: string;
  let originalMetaDescription: HTMLMetaElement | null;

  beforeEach(() => {
    // Store original values
    originalTitle = document.title;
    originalMetaDescription = document.querySelector('meta[name="description"]');
    
    // Reset document state
    document.title = '';
    
    // Remove existing meta description if present
    if (originalMetaDescription) {
      originalMetaDescription.remove();
    }
    
    // Create a fresh meta description element
    const metaElement = document.createElement('meta');
    metaElement.name = 'description';
    metaElement.content = '';
    document.head.appendChild(metaElement);
  });

  afterEach(() => {
    // Restore original values
    document.title = originalTitle;
    
    // Clean up test meta element
    const testMeta = document.querySelector('meta[name="description"]');
    if (testMeta) {
      testMeta.remove();
    }
    
    // Restore original meta if it existed
    if (originalMetaDescription) {
      document.head.appendChild(originalMetaDescription);
    }
  });

  describe('title management', () => {
    it('should set document title when title prop is provided', () => {
      renderHook(() => usePageMeta({ title: 'Test Page' }));
      
      expect(document.title).toBe('Test Page | Exam Vault');
    });

    it('should not modify document title when title prop is undefined', () => {
      const initialTitle = 'Initial Title';
      document.title = initialTitle;
      
      renderHook(() => usePageMeta({ title: undefined }));
      
      expect(document.title).toBe(initialTitle);
    });

    it('should not modify document title when title prop is empty string', () => {
      const initialTitle = 'Initial Title';
      document.title = initialTitle;
      
      renderHook(() => usePageMeta({ title: '' }));
      
      expect(document.title).toBe(initialTitle);
    });

    it('should update document title when title prop changes', () => {
      const { rerender } = renderHook(
        ({ title }) => usePageMeta({ title }),
        { initialProps: { title: 'First Title' } }
      );
      
      expect(document.title).toBe('First Title | Exam Vault');
      
      rerender({ title: 'Second Title' });
      
      expect(document.title).toBe('Second Title | Exam Vault');
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Test & Special <Characters> "Quotes"';
      
      renderHook(() => usePageMeta({ title: specialTitle }));
      
      expect(document.title).toBe(`${specialTitle} | Exam Vault`);
    });
  });

  describe('description management', () => {
    it('should set meta description when description prop is provided', () => {
      const testDescription = 'This is a test description';
      
      renderHook(() => usePageMeta({ description: testDescription }));
      
      const metaElement = document.querySelector('meta[name="description"]');
      expect(metaElement?.getAttribute('content')).toBe(testDescription);
    });

    it('should not modify meta description when description prop is undefined', () => {
      const metaElement = document.querySelector('meta[name="description"]');
      const initialDescription = 'Initial description';
      metaElement?.setAttribute('content', initialDescription);
      
      renderHook(() => usePageMeta({ description: undefined }));
      
      expect(metaElement?.getAttribute('content')).toBe(initialDescription);
    });

    it('should not modify meta description when description prop is empty string', () => {
      const metaElement = document.querySelector('meta[name="description"]');
      const initialDescription = 'Initial description';
      metaElement?.setAttribute('content', initialDescription);
      
      renderHook(() => usePageMeta({ description: '' }));
      
      expect(metaElement?.getAttribute('content')).toBe(initialDescription);
    });

    it('should update meta description when description prop changes', () => {
      const { rerender } = renderHook(
        ({ description }) => usePageMeta({ description }),
        { initialProps: { description: 'First description' } }
      );
      
      const metaElement = document.querySelector('meta[name="description"]');
      expect(metaElement?.getAttribute('content')).toBe('First description');
      
      rerender({ description: 'Second description' });
      
      expect(metaElement?.getAttribute('content')).toBe('Second description');
    });

    it('should handle case when meta description element does not exist', () => {
      // Remove the meta description element
      const metaElement = document.querySelector('meta[name="description"]');
      metaElement?.remove();
      
      // Should not throw error
      expect(() => {
        renderHook(() => usePageMeta({ description: 'Test description' }));
      }).not.toThrow();
    });

    it('should handle special characters in description', () => {
      const specialDescription = 'Description with <tags> & "quotes" and symbols @#$%';
      
      renderHook(() => usePageMeta({ description: specialDescription }));
      
      const metaElement = document.querySelector('meta[name="description"]');
      expect(metaElement?.getAttribute('content')).toBe(specialDescription);
    });
  });

  describe('combined functionality', () => {
    it('should set both title and description when both props are provided', () => {
      const testTitle = 'Combined Test';
      const testDescription = 'Combined test description';
      
      renderHook(() => usePageMeta({ 
        title: testTitle, 
        description: testDescription 
      }));
      
      expect(document.title).toBe(`${testTitle} | Exam Vault`);
      
      const metaElement = document.querySelector('meta[name="description"]');
      expect(metaElement?.getAttribute('content')).toBe(testDescription);
    });

    it('should update independently when props change separately', () => {
      const { rerender } = renderHook(
        ({ title, description }) => usePageMeta({ title, description }),
        { 
          initialProps: { 
            title: 'Initial Title', 
            description: 'Initial description' 
          } 
        }
      );
      
      // Change only title
      rerender({ 
        title: 'Updated Title', 
        description: 'Initial description' 
      });
      
      expect(document.title).toBe('Updated Title | Exam Vault');
      const metaElement = document.querySelector('meta[name="description"]');
      expect(metaElement?.getAttribute('content')).toBe('Initial description');
      
      // Change only description
      rerender({ 
        title: 'Updated Title', 
        description: 'Updated description' 
      });
      
      expect(document.title).toBe('Updated Title | Exam Vault');
      expect(metaElement?.getAttribute('content')).toBe('Updated description');
    });
  });

  describe('cleanup and lifecycle', () => {
    it('should not cause memory leaks when component unmounts', () => {
      const { unmount } = renderHook(() => usePageMeta({ 
        title: 'Test Title',
        description: 'Test description'
      }));
      
      // Verify initial state
      expect(document.title).toBe('Test Title | Exam Vault');
      
      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
      
      // Title should remain (this is expected behavior - we don't clean up on unmount)
      expect(document.title).toBe('Test Title | Exam Vault');
    });

    it('should handle rapid prop changes without issues', () => {
      const { rerender } = renderHook(
        ({ title }) => usePageMeta({ title }),
        { initialProps: { title: 'Title 1' } }
      );
      
      // Rapidly change titles
      for (let i = 2; i <= 10; i++) {
        rerender({ title: `Title ${i}` });
      }
      
      expect(document.title).toBe('Title 10 | Exam Vault');
    });
  });
});