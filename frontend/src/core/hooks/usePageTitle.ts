import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title.includes('CivicPulse') ? title : `${title} | CivicPulse`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
