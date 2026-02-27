import React from 'react';
import { Link } from 'react-router';
import { Link2 } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

interface EditableLinkProps {
  id: string;
  defaultHref: string;
  className?: string;
  /** Extra classes applied to the URL input — useful for dark backgrounds */
  inputClassName?: string;
  children: React.ReactNode;
}

/**
 * A link whose href is stored in the CMS.
 * In edit mode it renders the children + an inline URL field.
 * In view mode it renders as a React Router <Link> (internal) or <a> (external).
 */
export const EditableLink = ({
  id,
  defaultHref,
  className,
  inputClassName,
  children,
}: EditableLinkProps) => {
  const { isEditing, getContent, updateContent } = useCMS();
  const href = getContent(id, defaultHref) as string;
  const isExternal = href.startsWith('http') || href.startsWith('//');

  if (isEditing) {
    // In edit mode, render a non-navigating wrapper so clicks open
    // the text/redirection editor instead of changing page.
    return <div className={className}>{children}</div>;
  }

  if (isExternal) {
    return (
      <a href={href || defaultHref} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href || defaultHref} className={className}>
      {children}
    </Link>
  );
};
