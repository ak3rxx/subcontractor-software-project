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

  // Auto-save function
  const saveToLocalStorage = useCallback(() => {
    if (!enabled) return;

    try {
      const saveData = {
        formData,
        timestamp: Date.now(),
        saveCount: saveCount + 1
      };
      
      localStorage.setItem(`autosave-${key}`, JSON.stringify(saveData));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSaveCount(prev => prev + 1);
      
      onSave?.(formData);
      
      // Only notify after the first auto-save to avoid spam
      if (saveCount > 0) {
        qaNotifications.notifyAutoSave(Object.keys(formData).length);
      }
    } catch (error) {
      console.error('Failed to auto-save form data:', error);
    }
  }, [formData, enabled, key, saveCount, onSave, qaNotifications]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (!enabled) return null;

    try {
      const saved = localStorage.getItem(`autosave-${key}`);
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if saved within last 7 days
        if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          onRestore?.(data.formData);
          setLastSaved(new Date(data.timestamp));
          setSaveCount(data.saveCount || 0);
          return data.formData;
        }
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
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