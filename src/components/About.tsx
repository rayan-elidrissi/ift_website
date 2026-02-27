import React from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Team } from "./Team";
import { EditableContent } from "./cms/EditableContent";
import { EditableImageSingle } from "./cms/EditableImageSingle";
// Placeholder image (replace with real asset when ready)
const aboutImage = 'https://placehold.co/800x600/f5f5f5/999?text=About';

export const About = () => {
  return (
    <>
      <section
        id="about"
        className="relative pt-32 pb-24 bg-white text-neutral-900 overflow-hidden font-serif"
      >
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-stretch">
            {/* Text Content */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="mb-16">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-neutral-900 leading-[0.9] uppercase"
                  >
                    <EditableContent
                      id="about-title"
                      defaultContent="About"
                      enableProse={false}
                    />
                  </motion.h1>
                  <p className="text-lg md:text-xl text-neutral-500 font-serif italic mb-8 leading-relaxed max-w-lg">
                    <EditableContent
                      id="about-subtitle"
                      defaultContent="Institute for Future Technologies"
                      enableProse={false}
                    />
                  </p>
                  <div className="font-sans text-neutral-500 text-sm md:text-base leading-relaxed border-l-2 border-teal-600 pl-6">
                    <EditableContent
                      id="about-intro"
                      defaultContent="The Institute for Future Technologies (IFT) at Pôle Léonard de Vinci is dedicated to inventing technologies that shape the future. We bridge the gap between engineering, management, and design to foster a unique ecosystem of innovation."
                    />
                  </div>
                </div>

                <div className="space-y-8 font-sans">
                  <div className="group">
                    <h4 className="flex items-center gap-3 font-bold text-neutral-900 mb-2 uppercase tracking-widest text-xs">
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full"></span>
                      <EditableContent id="about-pillar-1-title" defaultContent="Human-Centered Design" enableProse={false} />
                    </h4>
                    <div className="text-neutral-500 text-sm pl-4.5">
                      <EditableContent id="about-pillar-1-desc" defaultContent="Focusing on technology that serves humanity and improves lives." />
                    </div>
                  </div>

                  <div className="group">
                    <h4 className="flex items-center gap-3 font-bold text-neutral-900 mb-2 uppercase tracking-widest text-xs">
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full"></span>
                      <EditableContent id="about-pillar-2-title" defaultContent="Sustainable Future" enableProse={false} />
                    </h4>
                    <div className="text-neutral-500 text-sm pl-4.5">
                      <EditableContent id="about-pillar-2-desc" defaultContent="Developing solutions with long-term environmental perspectives." />
                    </div>
                  </div>

                  <div className="group">
                    <h4 className="flex items-center gap-3 font-bold text-neutral-900 mb-2 uppercase tracking-widest text-xs">
                      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full"></span>
                      <EditableContent id="about-pillar-3-title" defaultContent="Hands-on Learning" enableProse={false} />
                    </h4>
                    <div className="text-neutral-500 text-sm pl-4.5">
                      <EditableContent id="about-pillar-3-desc" defaultContent="Learning by doing through our various labs and workshops." />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block lg:col-span-1"></div>

            {/* Image Section - Art Gallery Style */}
            <motion.div
              className="lg:col-span-6 relative mt-12 lg:mt-0 h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="relative z-10 h-full">
                {/* Image Frame */}
                
                <div className="h-full w-full overflow-hidden transition-all duration-1000 ease-in-out">
                  <EditableImageSingle
                    id="about-campus-image"
                    defaultImage={aboutImage}
                    alt="IFT Campus Architecture"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <style>{`
          .writing-vertical-rl {
            writing-mode: vertical-rl;
          }
        `}</style>
      </section>
      <Team />
    </>
  );
};