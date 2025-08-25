import { useState, useCallback } from 'react';

export const useFieldVisibility = () => {
  const [showGoogleClientId, setShowGoogleClientId] = useState(false);
  const [showCalendarificApiKey, setShowCalendarificApiKey] = useState(false);

  const toggleGoogleClientIdVisibility = useCallback(() => {
    setShowGoogleClientId((prev) => !prev);
  }, []);

  const toggleCalendarificApiKeyVisibility = useCallback(() => {
    setShowCalendarificApiKey((prev) => !prev);
  }, []);

  const resetVisibility = useCallback(() => {
    setShowGoogleClientId(false);
    setShowCalendarificApiKey(false);
  }, []);

  return {
    showGoogleClientId,
    showCalendarificApiKey,
    toggleGoogleClientIdVisibility,
    toggleCalendarificApiKeyVisibility,
    resetVisibility,
  };
};
