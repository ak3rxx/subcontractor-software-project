
import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface SafeChartWrapperProps {
  children: React.ReactNode;
  data: any[];
  title: string;
  minDataPoints?: number;
  fallbackMessage?: string;
}

const SafeChartWrapper: React.FC<SafeChartWrapperProps> = ({
  children,
  data,
  title,
  minDataPoints = 1,
  fallbackMessage = "No data available"
}) => {
  // Validate data before rendering
  const isValidData = () => {
    if (!Array.isArray(data) || data.length < minDataPoints) {
      return false;
    }
    
    // Check if data contains valid numeric values
    return data.every(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Check if at least one numeric value exists and is valid
      return Object.values(item).some(value => {
        if (typeof value === 'number') {
          return Number.isFinite(value) && !Number.isNaN(value);
        }
        return false;
      });
    });
  };

  const EmptyState = () => (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{fallbackMessage}</p>
        <p className="text-xs text-gray-400 mt-1">
          Data will appear here once inspections are created
        </p>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-lg bg-gray-50">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
        <p className="text-sm">Chart temporarily unavailable</p>
        <p className="text-xs text-gray-400 mt-1">
          Please try refreshing the page
        </p>
      </div>
    </div>
  );

  // Render safe chart or fallback
  try {
    if (!isValidData()) {
      return <EmptyState />;
    }

    return (
      <div className="chart-container">
        {children}
      </div>
    );
  } catch (error) {
    console.error(`SafeChartWrapper: Error in ${title}:`, error);
    return <ErrorState />;
  }
};

export default SafeChartWrapper;
