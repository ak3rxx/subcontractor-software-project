
import React from 'react';
import VariationManager from './variations/VariationManager';

interface VariationManagerRefactoredProps {
  projectName: string;
  projectId: string;
  crossModuleData?: any;
}

/**
 * @deprecated Use VariationManager instead. This component is kept for backward compatibility.
 */
const VariationManagerRefactored: React.FC<VariationManagerRefactoredProps> = (props) => {
  console.warn('VariationManagerRefactored is deprecated. Use VariationManager instead.');
  return <VariationManager {...props} />;
};

export default VariationManagerRefactored;
