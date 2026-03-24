import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    };

    checkMobile();
    
    // Optional: add listener for window resizing or orientation change if needed, 
    // but pointer:coarse usually doesn't change during session on most devices.
  }, []);

  return isMobile;
};
