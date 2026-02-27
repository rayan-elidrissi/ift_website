import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Video } from 'lucide-react';
import { EditableContent } from './cms/EditableContent';
import { EditableVideo } from './cms/EditableVideo';
import { EditableLink } from './cms/EditableLink';
import { CMSModal } from './cms/CMSModal';
import { useCMS } from '../context/CMSContext';
import heroVideo from '../assets/hero_video.mp4';

export const Hero = () => {
  const { isEditing, getContent, updateContent } = useCMS();
  const videoSrc = getContent('hero-video-url', '') as string;
  const [editingVideo, setEditingVideo] = useState(false);
  const [tempVideoSrc, setTempVideoSrc] = useState('');
  
  return (
    <div className="p-4 min-h-[calc(100vh-64px)] flex bg-[#ffffff]">
      <div className="relative w-full flex-grow rounded-[2rem] overflow-hidden shadow-sm group">
        
        {/* Main Background Media */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            src={videoSrc || heroVideo}
          />
        </div>
        
        {/* Gradient Overlay for Text Readability (light so video colors show) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {isEditing && (
          <>
            <button
              onClick={() => { setTempVideoSrc(videoSrc); setEditingVideo(true); }}
              className="absolute top-4 right-4 z-30 bg-white/90 hover:bg-white backdrop-blur-md px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold text-neutral-700 transition-colors"
            >
              <Video className="w-4 h-4 text-teal-600" />
              Change Video
            </button>

            <CMSModal
              isOpen={editingVideo}
              onClose={() => setEditingVideo(false)}
              onSave={() => { updateContent('hero-video-url', tempVideoSrc); setEditingVideo(false); }}
              title="Hero Background Video"
              size="lg"
            >
              <div className="p-6">
                <EditableVideo
                  value={tempVideoSrc}
                  onChange={setTempVideoSrc}
                  label="Hero Background Video"
                />
              </div>
            </CMSModal>
          </>
        )}

        {/* Content Container */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 lg:gap-16">
          
          {/* Hero Headline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-full max-w-4xl space-y-4"
          >
            <EditableContent 
              id="hero-title"
              defaultContent="Experiments in Building Futures"
              enableProse={false}
              className="text-4xl md:text-6xl lg:text-[4rem] font-sans font-bold text-white leading-[1.1] tracking-tight [&_p]:m-0"
            />
            <EditableContent 
              id="hero-blurb"
              defaultContent="A lab studio embedded in education, where students and researchers explore new forms of inquiry at the intersection of technology, human experience, and the natural world"
              enableProse={false}
              className="text-lg md:text-xl lg:text-2xl font-sans font-light text-white/90 leading-relaxed max-w-2xl [&_p]:m-0"
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto"
          >
            <EditableLink
              id="hero-button-url"
              defaultHref="/collaborate"
              className="w-full sm:w-auto bg-neutral-900/40 hover:bg-teal-600 backdrop-blur-md border border-white/20 hover:border-teal-500 text-white transition-all duration-300 px-8 py-4 rounded-full font-sans font-medium text-sm md:text-base flex items-center justify-center gap-3 group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-teal-500/20"
              inputClassName="text-xs bg-white/10 border-b border-dashed border-teal-400/60 text-white placeholder-white/30 outline-none w-52 py-0.5"
            >
              <span className="absolute inset-0 w-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:w-full transition-all duration-700 ease-out"></span>
              <EditableContent 
                id="hero-button"
                defaultContent="Engage With IFT"
                enableProse={false}
                multiline={false}
                secondaryId="hero-button-url"
                secondaryDefault="/collaborate"
                secondaryLabel="Redirection"
                secondaryPlaceholder="/collaborate or https://..."
                className="[&_p]:m-0 relative z-10"
              />
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
            </EditableLink>
          </motion.div>
        </div>
      </div>
    </div>
  );
};