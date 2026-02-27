import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { EditableVideo } from './EditableVideo';
import { EditableImage } from './EditableImage';
import { CMSModal } from './CMSModal';

interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'image' | 'video' | 'textarea' | 'select';
  options?: string[]; // For select
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  data: any;
  schema: FieldSchema[];
  title: string;
}

const EditModal = ({ isOpen, onClose, onSave, data, schema, title }: EditModalProps) => {
  const [formData, setFormData] = useState(data || {});

  useEffect(() => {
    setFormData(data || {});
  }, [data, isOpen]);

  const handleChange = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <CMSModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={title}
      size="md"
    >
      <div className="p-6 space-y-4">
        {schema.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[120px] text-sm"
              />
            ) : field.type === 'select' ? (
               <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
               >
                  <option value="">Select...</option>
                  {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                  ))}
               </select>
            ) : field.type === 'video' ? (
              <EditableVideo
                value={formData[field.key] || ''}
                onChange={(value) => handleChange(field.key, value)}
                label={field.label}
              />
            ) : field.type === 'image' ? (
              <EditableImage
                value={formData[field.key] || ''}
                onChange={(value) => handleChange(field.key, value)}
                label={field.label}
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>
    </CMSModal>
  );
};

interface EditableCollectionProps<T> {
  id: string;
  defaultData: T[];
  renderItem: (item: T, index: number, isEditing: boolean) => React.ReactNode;
  schema: FieldSchema[];
  itemClassName?: string;
  containerClassName?: string;
  maxItems?: number;
  getItemStyle?: (item: T, index: number) => React.CSSProperties;
}

export const EditableCollection = <T extends { id?: string }>({ 
  id, 
  defaultData, 
  renderItem, 
  schema,
  itemClassName = "",
  containerClassName = "",
  maxItems,
  getItemStyle,
  displayItems // New prop for filtered views
}: EditableCollectionProps<T> & { displayItems?: T[] }) => {
  const { isEditing, getContent, updateContent } = useCMS();
  const items = getContent(id, defaultData) as T[];
  
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Use displayItems if provided, otherwise use all items
  const itemsToRender = displayItems || items;

  const handleSaveItem = (itemData: T) => {
    let newItems = [...items];
    
    if (editingItem) {
      // Update existing
      const index = newItems.findIndex(i => (i.id && i.id === editingItem.id) || i === editingItem);
      if (index !== -1) {
        newItems[index] = { ...newItems[index], ...itemData };
      }
    } else {
      // This path shouldn't be reached for existing items, but just in case
    }
    
    updateContent(id, newItems);
    setEditingItem(null);
  };

  const handleAddItem = (itemData: T) => {
    const newItem = { ...itemData, id: Date.now().toString() }; // Ensure ID
    const newItems = [...items, newItem];
    updateContent(id, newItems);
    setIsAdding(false);
  };

  const handleDeleteItem = (itemToDelete: T) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const newItems = items.filter(i => (i.id && i.id !== itemToDelete.id) || i !== itemToDelete);
      updateContent(id, newItems);
    }
  };

  const handleMoveItem = (itemToMove: T, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => (i.id && i.id === itemToMove.id) || i === itemToMove);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [removed] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    updateContent(id, newItems);
  };

  return (
    <>
      <div className={containerClassName}>
        {itemsToRender.map((item, index) => (
          <div key={item.id || index} className={`relative group ${itemClassName}`} style={getItemStyle ? getItemStyle(item, index) : undefined}>
            {renderItem(item, index, isEditing)}
            
            {isEditing && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveItem(item, 'up'); }}
                  className="bg-neutral-800 text-white p-1.5 rounded-full hover:bg-neutral-900 shadow-lg"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveItem(item, 'down'); }}
                  className="bg-neutral-800 text-white p-1.5 rounded-full hover:bg-neutral-900 shadow-lg"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                  className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 shadow-lg"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isEditing && (!maxItems || items.length < maxItems) && !displayItems && (
          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center justify-center border-2 border-dashed border-neutral-300 hover:border-teal-500 hover:text-teal-600 text-neutral-400 rounded-lg transition-colors p-8 min-h-[200px] w-full ${itemClassName}`}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-8 h-8" />
              <span className="font-bold uppercase tracking-widest text-sm">Add Item</span>
            </div>
          </button>
        )}
      </div>

      <EditModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveItem}
        data={editingItem || {}}
        schema={schema}
        title="Edit Item"
      />

      <EditModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleAddItem}
        data={{}}
        schema={schema}
        title="Add New Item"
      />
    </>
  );
};