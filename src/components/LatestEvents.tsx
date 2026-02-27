import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, ArrowRight, Mic, Code, Zap, X, Ticket } from 'lucide-react';
import { EditableCollection } from './cms/EditableCollection';
import { EditableContent } from './cms/EditableContent';
import { EditableLink } from './cms/EditableLink';
import { useCMS } from '../context/CMSContext';

type EventItem = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  image: string;
  video: string;
};

const events: EventItem[] = [
  {
    id: 'e1',
    title: 'De Vinci Festival',
    type: 'flagship',
    date: 'March 15-17, 2025',
    location: 'Paris Campus',
    image: 'https://images.unsplash.com/photo-1732026261224-c55266116bc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    video: ''
  },
  {
    id: 'e2',
    title: 'Trailblazer Chat',
    type: 'internal',
    date: 'Fridays 14:00',
    location: 'Paris Campus',
    image: 'https://images.unsplash.com/photo-1542325488573-a28b3cd3c91d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    video: ''
  },
  {
    id: 'e4',
    title: 'Instant Future Talks',
    type: 'weekly',
    date: 'Thursdays 18:00',
    location: 'Paris Campus',
    image: 'https://images.unsplash.com/photo-1764874299006-bf4266427ec9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    video: ''
  },
  {
    id: 'e5',
    title: 'Panel Discussion & Shipping Friday',
    type: 'weekly',
    date: 'Thu 18:00 · Fri 14:00',
    location: 'Paris Campus',
    image: 'https://images.unsplash.com/photo-1764874299006-bf4266427ec9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    video: ''
  }
];

export const LatestEvents = () => {
  const { isEditing } = useCMS();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getFlexGrow = (index: number) => {
    if (hoveredIndex === null) return index === 0 ? 2 : 1;
    return hoveredIndex === index ? 2.4 : 0.9;
  };

  return (
    <section className="bg-neutral-50 py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <EditableContent 
            id="latest-events-label"
            defaultContent="Agenda"
            enableProse={false}
            className="text-teal-600 text-xs font-mono tracking-widest uppercase mb-2 block [&_p]:m-0"
          />
          <EditableContent 
            id="latest-events-title"
            defaultContent="Latest Events"
            enableProse={false}
            className="text-4xl md:text-6xl font-serif text-neutral-900 tracking-tight [&_p]:m-0"
          />
          <EditableLink
            id="latest-events-button-url"
            defaultHref="/events"
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-teal-600 transition-colors mt-6"
          >
            <EditableContent 
              id="latest-events-button"
              defaultContent="View Full Calendar"
              enableProse={false}
              multiline={false}
              secondaryId="latest-events-button-url"
              secondaryDefault="/events"
              secondaryLabel="Redirection"
              secondaryPlaceholder="/events or https://..."
              className="[&_p]:m-0"
            />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </EditableLink>
        </div>

        <EditableCollection
          id="latest-events"
          defaultData={events}
          maxItems={4}
          containerClassName="flex flex-col lg:flex-row gap-4 h-auto lg:h-[580px]"
          itemClassName="min-w-0 min-h-0"
          getItemStyle={(_, index) => ({
            flexGrow: getFlexGrow(index),
            flexShrink: 1,
            flexBasis: 0,
            transition: 'flex-grow 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          })}
          schema={[
            { key: 'title', label: 'Event Title', type: 'text' },
            { key: 'date', label: 'Date / Time', type: 'text' },
            { key: 'location', label: 'Location (Optional)', type: 'text' },
            { key: 'type', label: 'Type (flagship, weekly, internal)', type: 'select', options: ['flagship', 'weekly', 'internal'] },
            { key: 'image', label: 'Image', type: 'image' },
            { key: 'video', label: 'Video URL (Optional)', type: 'text' },
          ]}
          renderItem={(event, index) => {
             const isHovered = hoveredIndex === index;
             const isCompressed = hoveredIndex !== null && hoveredIndex !== index;
             const isDark = index === 0 || event.type === 'internal';

             return (
               <motion.div
                 role="button"
                 tabIndex={0}
                 onClick={() => setSelectedEvent(event)}
                 onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(event)}
                 onMouseEnter={() => setHoveredIndex(index)}
                 onMouseLeave={() => setHoveredIndex(null)}
                 className={`relative overflow-hidden cursor-pointer flex flex-col justify-end h-[280px] lg:h-full w-full
                   ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200'}`}
                 initial={{ opacity: 0, y: 16 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: index * 0.08 }}
               >
                 {/* Type badge */}
                 <div className={`absolute top-6 left-6 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest
                   ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                   {event.type}
                 </div>

                 {/* Teal accent bar — slides in on hover */}
                 <div
                   className="absolute bottom-0 left-0 h-[3px] bg-teal-500 transition-all duration-500 ease-out"
                   style={{ width: isHovered ? '100%' : '0%' }}
                 />

                 {/* Content */}
                 <div className="relative z-10 p-6 lg:p-8">
                   {/* Icon row */}
                   <div className={`flex items-center gap-2 mb-3 transition-colors duration-300
                     ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                     {event.type === 'internal' ? <Code className="w-4 h-4" /> :
                      event.type === 'flagship' ? <Zap className="w-4 h-4" /> :
                      <Mic className="w-4 h-4" />}
                   </div>

                   {/* Title */}
                   <h3 className={`font-serif leading-tight transition-all duration-500
                     ${isDark ? 'text-white' : 'text-neutral-900'}
                     ${isHovered ? 'text-xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>
                     {event.title}
                   </h3>

                   {/* Date + location — fade out when compressed on desktop */}
                   <div className={`mt-3 flex flex-wrap gap-4 text-xs font-mono transition-opacity duration-400
                     ${isDark ? 'text-neutral-400' : 'text-neutral-500'}
                     ${isCompressed ? 'lg:opacity-50' : 'opacity-100'}`}>
                     <div className="flex items-center gap-1.5">
                       <Calendar className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                       <span>{event.date}</span>
                     </div>
                     {event.location && (
                       <div className="flex items-center gap-1.5">
                         <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                         <span>{event.location}</span>
                       </div>
                     )}
                   </div>

                   {/* CTA — only shown when hovered */}
                   <div className={`flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest text-teal-400 transition-all duration-400
                     ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                     <span>View details</span>
                     <ArrowRight className="w-3.5 h-3.5" />
                   </div>
                 </div>
               </motion.div>
             );
          }}
        />

        {/* Classic template pop-up card */}
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvent(null)}
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col md:flex-row"
              >
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
                  aria-label="Close event details"
                >
                  <X className="w-6 h-6 text-neutral-900" />
                </button>

                <div className="w-full md:w-1/2 aspect-video md:aspect-auto md:h-auto bg-neutral-100 relative flex-shrink-0">
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-neutral-100">
                    {selectedEvent.type}
                  </div>
                </div>

                <div className="flex-grow p-8 md:p-12 flex flex-col overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-4 leading-tight">
                      {selectedEvent.title}
                    </h2>

                    <div className="flex flex-col gap-2 mb-8 border-l-2 border-teal-500 pl-4 py-1">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 font-mono">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span>{selectedEvent.date}</span>
                      </div>
                      {selectedEvent.location && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600 font-mono">
                          <MapPin className="w-4 h-4 text-teal-600" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-neutral-600 leading-relaxed text-base">
                      Explore this {selectedEvent.type} event with the IFT community. Click through to see more details, updates, and registration information.
                    </p>
                  </div>

                  <div className="mt-auto pt-8 border-t border-neutral-100 flex gap-4">
                    <button className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 hover:bg-teal-600 transition-all duration-300 uppercase text-xs font-bold tracking-widest flex-1 justify-center relative overflow-hidden group shadow-lg hover:shadow-2xl hover:shadow-teal-500/20">
                      <span className="absolute inset-0 w-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:w-full transition-all duration-700 ease-out"></span>
                      <Ticket className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Register</span>
                    </button>
                    <button className="flex items-center gap-2 border border-neutral-200 text-neutral-900 px-6 py-3 hover:bg-neutral-50 hover:border-teal-400 transition-all duration-300 uppercase text-xs font-bold tracking-widest flex-1 justify-center hover:shadow-md">
                      <Calendar className="w-4 h-4" />
                      Add to Calendar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};