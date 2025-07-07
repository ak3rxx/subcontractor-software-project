import { useEffect, useCallback } from 'react';

// Simple data coordination system for cross-component updates
export interface DataEvent {
  type: 'qa-inspection-created' | 'qa-inspection-updated' | 'qa-inspection-deleted' | 'project-updated';
  payload: {
    inspectionId?: string;
    projectId?: string;
    [key: string]: any;
  };
}

export const useDataCoordination = () => {
  // Emit data events to coordinate updates across components
  const emitDataEvent = useCallback((event: DataEvent) => {
    console.log('Data event emitted:', event.type, event.payload);
    window.dispatchEvent(new CustomEvent(event.type, { detail: event.payload }));
  }, []);

  // Listen for specific data events
  const listenToDataEvents = useCallback((
    eventTypes: DataEvent['type'][], 
    handler: (event: CustomEvent) => void
  ) => {
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handler as EventListener);
    });

    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handler as EventListener);
      });
    };
  }, []);

  return {
    emitDataEvent,
    listenToDataEvents
  };
};

// Hook for components that need to refresh when QA inspections change
export const useQAInspectionCoordination = (onRefresh: () => void) => {
  useEffect(() => {
    const handleQAEvents = (event: CustomEvent) => {
      console.log('QA event received, triggering refresh:', event.type);
      onRefresh();
    };

    const events = ['qa-inspection-created', 'qa-inspection-updated', 'qa-inspection-deleted'];
    events.forEach(eventType => {
      window.addEventListener(eventType, handleQAEvents as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleQAEvents as EventListener);
      });
    };
  }, [onRefresh]);
};

// Hook for components that need to refresh when projects change
export const useProjectCoordination = (onRefresh: () => void) => {
  useEffect(() => {
    const handleProjectEvents = (event: CustomEvent) => {
      console.log('Project event received, triggering refresh:', event.type);
      onRefresh();
    };

    window.addEventListener('project-updated', handleProjectEvents as EventListener);

    return () => {
      window.removeEventListener('project-updated', handleProjectEvents as EventListener);
    };
  }, [onRefresh]);
};