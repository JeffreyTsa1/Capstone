import { useEffect, useState } from "react";

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    checkViewport(); // initial check
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, [breakpoint]);

  return isMobile;
}