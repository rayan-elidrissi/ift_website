import React from 'react';
import { CMSProvider, useCMS } from '../../context/CMSContext';
import { Edit3, X } from 'lucide-react';

const CMSToggle = () => {
  const { isEditing, toggleEditMode, canEdit } = useCMS();

  if (!canEdit) return null;

  return (
    <button
      onClick={toggleEditMode}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
        isEditing 
          ? 'bg-neutral-900 text-white hover:bg-red-600 rotate-0' 
          : 'bg-teal-500 text-white hover:bg-teal-600 hover:scale-110'
      }`}
      title={isEditing ? "Exit Edit Mode" : "Enter Edit Mode"}
    >
      {isEditing ? <X className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
    </button>
  );
};

export const CMSWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <CMSProvider>
      {children}
      <CMSToggle />
    </CMSProvider>
  );
};
