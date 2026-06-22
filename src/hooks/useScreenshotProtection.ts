import { useEffect, useState } from 'react';

export const useScreenshotProtection = () => {
  const [isScreenshotAttempted, setIsScreenshotAttempted] = useState(false);

  useEffect(() => {
    let blurTimeout: ReturnType<typeof setTimeout>;

    // Detect common screenshot key combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // Common screenshot combinations
      const isScreenshotKey = 
        // Windows/Linux: Print Screen, Alt+Print Screen, Win+Print Screen
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'PrintScreen') ||
        (e.metaKey && e.key === 'PrintScreen') ||
        // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        // Some browser dev tools
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.key === 'F12');

      if (isScreenshotKey) {
        e.preventDefault();
        setIsScreenshotAttempted(true);
        document.body.classList.add('screenshot-blur');
        
        // Remove blur after 2 seconds
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => {
          setIsScreenshotAttempted(false);
          document.body.classList.remove('screenshot-blur');
        }, 2000);
      }
    };

    // Detect window focus changes (might indicate screenshot app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsScreenshotAttempted(true);
        document.body.classList.add('screenshot-blur');
        
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => {
          setIsScreenshotAttempted(false);
          document.body.classList.remove('screenshot-blur');
        }, 1000);
      }
    };

    // Mobile-specific: Detect rapid app switching (potential screenshot)
    const handleAppStateChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsScreenshotAttempted(true);
        document.body.classList.add('screenshot-blur');
        
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => {
          setIsScreenshotAttempted(false);
          document.body.classList.remove('screenshot-blur');
        }, 2000);
      }
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleAppStateChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    // Mobile-specific touch events
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        // Multi-touch might indicate screenshot gesture attempt
        e.preventDefault();
      }
    });

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      clearTimeout(blurTimeout);
      document.body.classList.remove('screenshot-blur');
    };
  }, []);

  return { isScreenshotAttempted };
};