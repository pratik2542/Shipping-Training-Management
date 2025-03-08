import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // More aggressive scroll reset with a slight delay to ensure it happens after rendering
    const timeoutId = setTimeout(() => {
      // Using both options for maximum compatibility
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, location.state]);

  return null;
};

export default ScrollToTop;