import { useState, useEffect, useCallback, useRef } from 'react';
import { useEnhancedQANotifications } from './useEnhancedQANotifications';

interface AutoSaveOptions {
  key: string;
  interval?: number;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
}

export const useFormAutoSave = <T extends Record<string, any>>(
  formData: T,
  options: AutoSaveOptions
) => {
  const {
    key,
    interval = 30000, // 30 seconds
    enabled = true,
    onSave,
    onRestore
  } = options;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  
  const qaNotifications = useEnhancedQANotifications();
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(formData);

  // Auto-save function with error handling
  const saveToLocalStorage = useCallback(() => {
    if (!enabled) return;

    try {
      const saveData = {
        formData,
        timestamp: Date.now(),
        saveCount: saveCount + 1,
        version: '1.0' // For future compatibility
      };
      
      // Use a unique key to prevent conflicts between different form instances
      const storageKey = `autosave-${key}-${Date.now().toString().slice(-6)}`;
      localStorage.setItem(storageKey, JSON.stringify(saveData));
      
      // Clean up old saves (keep only the latest 3)
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`autosave-${key}`));
      if (allKeys.length > 3) {
        allKeys.sort().slice(0, -3).forEach(oldKey => localStorage.removeItem(oldKey));
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSaveCount(prev => prev + 1);
      
      onSave?.(formData);
      
      // Only notify after the first auto-save and occasionally to avoid spam
      if (saveCount > 0 && saveCount % 3 === 0) {
        qaNotifications.notifyAutoSave(Object.keys(formData).length);
      }
    } catch (error) {
      console.error('Failed to auto-save form data:', error);
      // Try to free up space and retry once
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const allKeys = Object.keys(localStorage).filter(k => k.startsWith('autosave-'));
          allKeys.slice(0, -1).forEach(key => localStorage.removeItem(key));
          localStorage.setItem(`autosave-${key}`, JSON.stringify({ formData, timestamp: Date.now() }));
        } catch (retryError) {
          console.error('Retry save also failed:', retryError);
        }
      }
    }
  }, [formData, enabled, key, saveCount, onSave, qaNotifications]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // Load from localStorage with fallback
  const loadFromLocalStorage = useCallback(() => {
    if (!enabled) return null;

    try {
      // Find the most recent save
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`autosave-${key}`));
      if (allKeys.length === 0) return null;
      
      // Sort by timestamp (embedded in key) and get the latest
      const latestKey = allKeys.sort().pop();
      if (!latestKey) return null;
      
      const saved = localStorage.getItem(latestKey);
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if saved within last 7 days
        if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          onRestore?.(data.formData || data); // Handle both old and new formats
          setLastSaved(new Date(data.timestamp));
          setSaveCount(data.saveCount || 0);
          return data.formData || data;
        }
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
      // Try to clean up corrupted data
      try {
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`autosave-${key}`));
        allKeys.forEach(key => localStorage.removeItem(key));
      } catch (cleanupError) {
        console.error('Failed to cleanup corrupted data:', cleanupError);
      }
    }
    return null;
  }, [enabled, key, onRestore]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave-${key}`);
    setLastSaved(null);
    setHasUnsavedChanges(false);
    setSaveCount(0);
  }, [key]);

  // Check for changes and start auto-save timer
  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(previousDataRef.current);
    if (hasChanged) {
      setHasUnsavedChanges(true);
      previousDataRef.current = formData;

      // Reset the timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Start new timer
      saveTimerRef.current = setTimeout(saveToLocalStorage, interval);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [formData, enabled, interval, saveToLocalStorage]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        saveToLocalStorage();
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, hasUnsavedChanges, saveToLocalStorage]);

  return {
    lastSaved,
    hasUnsavedChanges,
    saveCount,
    saveNow,
    loadFromLocalStorage,
    clearSavedData,
    
    // Computed values
    timeSinceLastSave: lastSaved ? Date.now() - lastSaved.getTime() : null,
    hasSavedData: saveCount > 0
  };
};