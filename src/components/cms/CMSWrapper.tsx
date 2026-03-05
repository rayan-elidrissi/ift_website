import React from 'react';
import { CMSProvider, useCMS } from '../../context/CMSContext';
import { Edit3, Loader2, X } from 'lucide-react';

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

const CMSContent = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isApiConfigured } = useCMS();

  if (isApiConfigured && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" aria-hidden />
      </div>
    );
  }

  return (
    <>
      {children}
      <CMSToggle />
    </>
  );
};

export const CMSWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <CMSProvider>
      <CMSContent>{children}</CMSContent>
    </CMSProvider>
  );
};
