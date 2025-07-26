
import React from 'react';
import TopNav from '@/components/TopNav';
import { EnhancedTaskManager } from '@/components/tasks/EnhancedTaskManager';

const Tasks = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <EnhancedTaskManager
          showProjectFilter={true}
          title="Task Management Hub"
        />
      </div>
    </div>
  );
};

export default Tasks;
