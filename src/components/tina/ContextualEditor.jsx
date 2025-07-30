// src/components/tina/ContextualEditor.jsx - React component for full contextual editing
import React, { useEffect, useState } from 'react';
import { useTina } from 'tinacms/dist/react';

const ContextualEditor = ({ data, query, variables, children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Use TinaCMS hook for contextual editing
  const { data: tinaData, isLoading } = useTina({
    query,
    variables,
    data,
  });
  
  useEffect(() => {
    // Check if we're in edit mode
    const editMode = 
      window.location.search.includes('tina-admin=true') ||
      window.location.pathname.includes('/admin') ||
      process.env.NODE_ENV === 'development';
    
    setIsEditMode(editMode);
    
    if (editMode) {
      document.documentElement.classList.add('tina-edit-mode');
      
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="tina-loading">
        <div className="loading-spinner">🦙 Loading TinaCMS...</div>
      </div>
    );
  }
  
  return (
    <div className={`tina-contextual-wrapper ${isEditMode ? 'edit-mode' : ''}`}>
      {children}
      
      {isEditMode && (
        <div className="tina-edit-overlay">
          <div className="tina-edit-controls">
            <button 
              onClick={() => window.tinaCMS?.save()}
              className="tina-btn tina-btn-save"
            >
              💾 Save
            </button>
            <button 
              onClick={() => window.tinaCMS?.togglePreview()}
              className="tina-btn tina-btn-preview"
            >
              👁️ Preview
            </button>
            <button 
              onClick={() => {
                setIsEditMode(false);
                document.documentElement.classList.remove('tina-edit-mode');
              }}
              className="tina-btn tina-btn-exit"
            >
              ❌ Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextualEditor;
