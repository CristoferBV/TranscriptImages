import { useMemo } from 'react';

export const useIsMobile = (): boolean => {
  return useMemo(() => {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }, []);
};
