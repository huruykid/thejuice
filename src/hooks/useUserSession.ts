import { useEffect, useState } from 'react';

export const useUserSession = () => {
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    setIsReturningUser(!!hasVisited);
    
    // Mark as visited for future visits
    if (!hasVisited) {
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  return { isReturningUser };
};