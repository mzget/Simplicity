import { useState, useEffect } from 'react';

/**
 * Hook to detect if current viewport width is below a given breakpoint.
 * Defaults to 768px (Tailwind 'md' breakpoint).
 * Supports standard browser matchMedia as well as jsdom / fallback environments.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof window.matchMedia === 'function') {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      const updateMatch = () => setIsMobile(mql.matches);

      updateMatch();

      mql.addEventListener('change', updateMatch);
      return () => {
        mql.removeEventListener('change', updateMatch);
      };
    }

    // Fallback for environments without matchMedia (e.g. standard jsdom)
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
