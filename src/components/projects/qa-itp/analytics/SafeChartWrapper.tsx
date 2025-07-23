
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
  // Comprehensive data validation
  const isValidData = () => {
    try {
      if (!Array.isArray(data) || data.length < minDataPoints) {
        console.log(`SafeChartWrapper: Invalid data array for ${title}:`, data);
        return false;
      }
      
      // Check each data point for valid numeric values
      const hasValidData = data.every(item => {
        if (!item || typeof item !== 'object') {
          console.log(`SafeChartWrapper: Invalid data item for ${title}:`, item);
          return false;
        }
        
        // Check if at least one numeric value exists and is valid
        const hasValidNumbers = Object.values(item).some(value => {
          if (typeof value === 'number') {
            const isValid = Number.isFinite(value) && !Number.isNaN(value);
            if (!isValid) {
              console.log(`SafeChartWrapper: Invalid number in ${title}:`, value);
            }
            return isValid;
          }
          return false;
        });
        
        return hasValidNumbers;
      });
      
      console.log(`SafeChartWrapper: Data validation for ${title}:`, hasValidData);
      return hasValidData;
    } catch (error) {
      console.error(`SafeChartWrapper: Validation error for ${title}:`, error);
      return false;
    }
  };

  const EmptyState = () => (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{fallbackMessage}</p>
        <p className="text-xs text-gray-400 mt-1">
          Charts will appear here once data is available
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

  // Safe rendering with comprehensive error handling
  try {
    if (!isValidData()) {
      return <EmptyState />;
    }

    return (
      <div className="chart-container">
        <div className="chart-error-boundary">
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error(`SafeChartWrapper: Render error in ${title}:`, error);
    return <ErrorState />;
  }
};

export default SafeChartWrapper;
