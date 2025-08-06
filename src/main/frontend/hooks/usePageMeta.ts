import { useEffect } from 'react';

interface UsePageMetaProps {
  title?: string;
  description?: string;
}

export const usePageMeta = ({ title, description }: UsePageMetaProps) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Exam Vault`;
    }
  }, [title]);

  useEffect(() => {
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
  }, [description]);
};
