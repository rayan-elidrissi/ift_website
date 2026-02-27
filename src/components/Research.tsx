import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Share2, Filter, ArrowUpRight, Download, Calendar, X } from 'lucide-react';
import { EditableCollection } from './cms/EditableCollection';
import { EditableContent } from './cms/EditableContent';
import { useCMS } from '../context/CMSContext';

const researchThemes = [
  {
    id: '01',
    title: 'Human-Computer Interaction',
    description: 'Redefining the boundary between physical and digital worlds through haptics, VR, and embodied interaction. We investigate how technology can seamlessly integrate with human perception.',
    image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=1080&auto=format&fit=crop',
    tags: ['Haptics', 'VR', 'Embodiment']
  },
  {
    id: '02',
    title: 'Artificial Intelligence & Ethics',
    description: 'Investigating the societal impact of AI while developing creative tools that augment human potential. Our work focuses on the intersection of generative algorithms and human creativity.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1080&auto=format&fit=crop',
    tags: ['Ethics', 'Generative AI', 'Society']
  },
  {
    id: '03',
    title: 'Sustainable Engineering',
    description: 'Designing resilient technological systems that prioritize ecological balance and long-term sustainability. We explore bio-materials, swarm intelligence for disaster recovery, and green energy systems.',
    image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1080&auto=format&fit=crop',
    tags: ['Sustainability', 'Green Tech', 'Systems']
  }
];

const defaultPublications = [
  {
    id: "01",
    title: "ReTouche: Embodied Representations for Self-Directed Piano Learning",
    authors: "P.P. Arslan, H. Noh, M. Tamashiro, L. Badr, B. Lebrun, P. Lindber, H. Ishii, X. Xiao",
    year: "2026",
    journal: "CHI 2026",
    abstract: "Exploring embodied representations to facilitate self-directed piano learning through haptic and visual feedback mechanisms.",
    tags: ["HCI", "Haptics", "Learning"],
    image: "https://images.unsplash.com/photo-1767716134807-646b08712f6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: true
  },
  {
    id: "02",
    title: "Co-Ideation Across Time: Revitalizing Legacy Design Sketchnotes with Conversational AI Agents to Foster Intergenerational Collaboration",
    authors: "L. Li, Q. Kuang, X. Xiao, JB. Labrune, H. Ishii",
    year: "2026",
    journal: "CHI 2026",
    abstract: "Investigating how conversational AI agents can bridge temporal gaps in design thinking by revitalizing legacy sketchnotes and fostering intergenerational collaboration.",
    tags: ["AI", "HCI", "Design"],
    image: "https://images.unsplash.com/photo-1647778977783-a8e03abc8dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: true
  },
  {
    id: "03",
    title: "Haptixel: Enabling Data Physicalization through Force-based Encountered-Type Fingertip Haptics",
    authors: "E. Bouzbib, L. Badr, A. Prouzeau, C. Pacchierotti, A. Lécuyer",
    year: "2026",
    journal: "CHI 2026",
    abstract: "A novel approach to data physicalization using force-based encountered-type haptic feedback at the fingertip level, making data tangible and explorable.",
    tags: ["Haptics", "Data Vis", "HCI"],
    image: "https://images.unsplash.com/photo-1610766456229-a613e4f93814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: true
  },
  {
    id: "04",
    title: "MirrorMorphose",
    authors: "M. Truong, S. Arnaud, M. Tamashiro, B. Costanzo, I. Winder, X. Xiao",
    year: "2026",
    journal: "TEI 2026 (Art Track)",
    abstract: "An artistic exploration of transformation and reflection through interactive tangible media.",
    tags: ["Art", "HCI", "Interfaces"],
    image: "https://images.unsplash.com/photo-1737061365196-ea67128d64fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: true
  },
  {
    id: "05",
    title: "Material Negotiations: Cultivating Bacterial Cellulose as Transitional Design Practice",
    authors: "V. Roussel, M. Teyssier",
    year: "2026",
    journal: "ISEA 2026",
    abstract: "Exploring bacterial cellulose cultivation as a transitional design practice that bridges biological processes and material design.",
    tags: ["Bio-Design", "Materials", "Art"],
    image: "https://images.unsplash.com/photo-1694500069324-d782decdd190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: true
  },
  {
    id: "06",
    title: "Designing Biohybrid Interfaces through Microbial Morphogenesis: A Case of Co-Becoming with Kombucha",
    authors: "V. Roussel, T. Safa",
    year: "2026",
    journal: "ISEA 2026",
    abstract: "Investigating the design of biohybrid interfaces using kombucha and microbial morphogenesis, exploring co-becoming between living organisms and interactive systems.",
    tags: ["Bio-Design", "Interfaces", "Art"],
    image: "https://images.unsplash.com/photo-1737061365196-ea67128d64fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: false
  },
  {
    id: "07",
    title: "Reimagining Learning through Arts & Making: Creative Identity Work in Partnership",
    authors: "Kristina Stamatis, Joseph Polman, Jrène Rahm, Mariana Tamashiro, et al.",
    year: "2026",
    journal: "ISLS 2026 (Symposium)",
    abstract: "A symposium exploring creative identity work in partnership, examining how arts and making can transform learning experiences across different contexts.",
    tags: ["Learning", "Art", "Education"],
    image: "https://images.unsplash.com/photo-1759270463243-414a287681be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: false
  },
  {
    id: "08",
    title: "From Remote Space to Remote Time (Panel)",
    authors: "H. Ishii, H.J. Youn, J. Li, X. Xiao, E. Ch'ng, J. Brubaker, J. Wallace, P. Pataranutaporn",
    year: "2026",
    journal: "CHI 2026 (Panel)",
    abstract: "A panel discussion exploring the evolution from remote space collaboration to temporal collaboration, examining how technology mediates time-shifted interactions.",
    tags: ["HCI", "Collaboration", "Future"],
    image: "https://images.unsplash.com/photo-1647083701139-3930542304cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    featured: false
  }
];

// Helper to map tags to main categories
const matchesCategory = (tags: string[], category: string) => {
  if (category === 'All') return true;
  const lowerTags = tags.map(t => t.toLowerCase());
  
  if (category === 'HCI') {
    return lowerTags.some(t => ['hci', 'vr', 'ar', 'haptics', 'ux', 'interfaces', 'web'].some(k => t.includes(k)));
  }
  if (category === 'Robotics') {
    return lowerTags.some(t => ['robotics', 'drone', 'automation'].some(k => t.includes(k)));
  }
  if (category === 'Bioengineering') {
    return lowerTags.some(t => ['bio', 'health', 'materials', 'living'].some(k => t.includes(k)));
  }
  return false;
};

export const Research = () => {
  const { getContent, isEditing } = useCMS();
  const allPublications = getContent('research-publications', defaultPublications);
  
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTheme, setActiveTheme] = useState(researchThemes[0]);
  const [viewingPaper, setViewingPaper] = useState<typeof allPublications[0] | null>(null);
  const [isPaperAbstractExpanded, setIsPaperAbstractExpanded] = useState(false);
  const [hasPaperAbstractOverflow, setHasPaperAbstractOverflow] = useState(false);
  const paperAbstractRef = useRef<HTMLDivElement | null>(null);
  const [isHoveringList, setIsHoveringList] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (viewingPaper) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingPaper]);

  useEffect(() => {
    if (viewingPaper) {
      setIsPaperAbstractExpanded(false);
    }
  }, [viewingPaper]);

  useEffect(() => {
    if (!viewingPaper || isPaperAbstractExpanded) {
      setHasPaperAbstractOverflow(false);
      return;
    }

    const checkOverflow = () => {
      const el = paperAbstractRef.current;
      if (!el) return;
      setHasPaperAbstractOverflow(el.scrollHeight > el.clientHeight + 1);
    };

    const frame = requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [viewingPaper, isPaperAbstractExpanded]);

  // Extract unique years and sort descending
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(allPublications.map((p: any) => p.year)));
    return ['All', ...uniqueYears.sort((a: any, b: any) => b.localeCompare(a))];
  }, [allPublications]);

  const categories = ['All', 'HCI', 'Bioengineering', 'Robotics'];

  // Filter full publications
  const filteredPublications = useMemo(() => {
    let pubs = [...allPublications].sort((a: any, b: any) => b.year.localeCompare(a.year));
    
    // Filter by Year
    if (selectedYear !== 'All') {
      pubs = pubs.filter(p => p.year === selectedYear);
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      pubs = pubs.filter(p => matchesCategory(p.tags, selectedCategory));
    }

    return pubs;
  }, [selectedYear, selectedCategory, allPublications]);

  return (
    <div className="bg-white min-h-screen text-neutral-900 relative font-sans selection:bg-teal-200 selection:text-black">
      
      {/* Shared Background Grid */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* FEATURED THEMES SECTION */}
      <section className="max-w-[1920px] mx-auto min-h-screen flex flex-col lg:flex-row relative z-10">
        
        {/* LEFT COLUMN: List */}
        <div className="lg:w-1/2 p-6 lg:p-12 xl:p-20 pt-32 lg:pt-32 flex flex-col justify-center bg-white/95 backdrop-blur-sm border-r border-neutral-200">
          
          <div className="mb-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-neutral-900 leading-[0.9] uppercase"
            >
              <EditableContent
                id="research-title"
                defaultContent="Research"
                enableProse={false}
                className="[&_p]:m-0"
              />
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-neutral-500 font-serif italic mb-12 max-w-lg leading-relaxed"
            >
              <EditableContent
                id="research-tagline"
                defaultContent="We explore the intersection of humanity and technology, designing systems that are not just functional, but meaningful, ethical, and sustainable."
                enableProse={false}
                className="[&_p]:m-0"
              />
            </motion.p>
            
            <h2 className="font-mono text-sm uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              <EditableContent
                id="research-core-themes-label"
                defaultContent="Core Research Themes"
                enableProse={false}
                className="[&_p]:inline [&_p]:m-0"
              />
            </h2>
          </div>

          <div
            onMouseEnter={() => setIsHoveringList(true)}
            onMouseLeave={() => setIsHoveringList(false)}
          >
            <EditableCollection
              id="research-themes"
              defaultData={researchThemes}
              containerClassName="space-y-0 min-h-[300px]"
              schema={[
                { key: 'title', label: 'Theme Title', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'image', label: 'Image', type: 'image' },
                { key: 'tags', label: 'Tags (comma separated)', type: 'text' },
              ]}
              renderItem={(theme: any) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setActiveTheme(theme)}
                  className={`py-8 border-t border-neutral-200 cursor-pointer transition-all duration-300 ${activeTheme.id === theme.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                >
                  <div className="flex items-baseline justify-between relative z-10 px-4">
                    <div className="flex items-baseline gap-8">
                       <span className={`font-mono text-xs transition-colors duration-300 ${activeTheme.id === theme.id ? 'text-teal-600' : 'text-neutral-400'}`}>
                          {theme.id}
                       </span>
                       <h3 className="text-2xl md:text-3xl font-light group-hover:translate-x-4 transition-transform duration-500 ease-out text-neutral-900">
                         {theme.title}
                       </h3>
                    </div>
                  </div>

                  {activeTheme.id === theme.id && (
                    <motion.div
                      layoutId="activeLine"
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-teal-600"
                    />
                  )}
                </motion.div>
              )}
            />
            <div className="border-t border-neutral-200" />
          </div>

        </div>

        {/* RIGHT COLUMN: Preview (Sticky) */}
        <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 bg-neutral-100 relative overflow-hidden hidden lg:block">
           
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTheme.id}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.5 }}
               className="absolute inset-0 z-0"
             >
                <img 
                  src={activeTheme.image} 
                  alt={activeTheme.title}
                  className="w-full h-full object-cover opacity-100 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-20" />
             </motion.div>
           </AnimatePresence>

           <div className="absolute inset-0 z-10 p-12 lg:p-20 flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.div
                   key={activeTheme.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.4, ease: "easeOut" }}
                   className="bg-white/90 backdrop-blur-md p-8 md:p-12 border border-white/50 shadow-2xl"
                >
                  <div className="flex flex-wrap gap-2 mb-6">
                    {activeTheme.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 border border-teal-200 bg-teal-50 rounded-full text-[10px] uppercase tracking-wider text-teal-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-3xl md:text-4xl font-serif leading-tight mb-6 text-neutral-900">
                    {activeTheme.title}
                  </h2>

                  <p className="text-neutral-700 font-sans leading-relaxed text-sm md:text-base mb-4 border-l-2 border-teal-600 pl-6">
                    {activeTheme.description}
                  </p>
                </motion.div>
              </AnimatePresence>
           </div>
           
           <div className="absolute top-8 right-8 font-mono text-xs text-neutral-400 writing-vertical-rl z-20 mix-blend-difference text-white">
              RESEARCH_THEMES
           </div>
           <div className="absolute bottom-8 right-8 font-mono text-[100px] leading-none text-white/20 font-bold z-0 mix-blend-overlay">
              {activeTheme.id}
           </div>

        </div>
        
        <style>{`
          .writing-vertical-rl {
            writing-mode: vertical-rl;
          }
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}</style>
      </section>

      {/* FULL PUBLICATIONS LIST SECTION */}
      <section className="bg-neutral-50 py-24 px-6 md:px-12 xl:px-20 relative z-10 border-t border-neutral-200">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
               <div>
                  <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">All Publications</h2>
                  <p className="text-neutral-500 font-sans mb-8">Chronological archive of all published research.</p>

                  {/* Year Filter */}
                  <div className="flex items-center gap-6 text-sm font-mono uppercase tracking-widest overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-neutral-500 flex items-center gap-2 flex-shrink-0">
                      <Filter className="w-3 h-3" />
                      Filter:
                    </span>
                    {years.map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`relative transition-colors duration-300 hover:text-black whitespace-nowrap ${selectedYear === year ? 'text-teal-600' : 'text-neutral-400'}`}
                      >
                        {year}
                        {selectedYear === year && (
                          <motion.div 
                            layoutId="activeYear"
                            className="absolute -bottom-1 left-0 right-0 h-px bg-teal-600"
                          />
                        )}
                      </button>
                    ))}
                  </div>
               </div>
               
               {/* Category Filter */}
               <div className="md:text-right">
                  <div className="text-neutral-500 text-xs font-mono uppercase tracking-widest mb-4">Category</div>
                  <div className="flex flex-wrap md:justify-end gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all duration-300 relative overflow-hidden group ${
                          selectedCategory === cat 
                            ? 'bg-teal-600 border-teal-600 text-white shadow-lg' 
                            : 'bg-white border-neutral-300 text-neutral-600 hover:border-teal-400 hover:shadow-md'
                        }`}
                      >
                        {selectedCategory === cat && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></span>
                        )}
                        <span className="relative z-10">{cat}</span>
                      </button>
                    ))}
                   </div>
                </div>
            </div>

            <div className="mt-12">
               <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                   <EditableCollection
                      id="research-publications"
                      defaultData={defaultPublications}
                      displayItems={filteredPublications}
                      schema={[
                        { key: 'title', label: 'Title', type: 'text' },
                        { key: 'authors', label: 'Authors', type: 'text' },
                        { key: 'year', label: 'Year', type: 'text' },
                        { key: 'journal', label: 'Journal/Conference', type: 'text' },
                        { key: 'abstract', label: 'Abstract', type: 'textarea' },
                        { key: 'image', label: 'Image', type: 'image' },
                        { key: 'video', label: 'Video (Optional)', type: 'video' },
                        { key: 'tags', label: 'Tags (comma separated array)', type: 'text' },
                        { key: 'featured', label: 'Featured? (true/false)', type: 'text' }
                      ]}
                      containerClassName="contents"
                      renderItem={(pub: any, index: number) => (
                         <motion.div 
                           key={`pub-${pub.id}`}
                           initial={{ opacity: 0, y: 50 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: 0.05 }}
                           onClick={() => setViewingPaper(pub)}
                           className="break-inside-avoid mb-8 group bg-white border border-neutral-200 hover:border-teal-500 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col shadow-sm hover:shadow-2xl relative"
                         >
                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-neutral-100 -mr-4 -mt-4 rotate-45 transform group-hover:bg-teal-500 transition-colors z-20"></div>

                            {/* Image or Video */}
                            <div className="w-full aspect-video bg-neutral-100 overflow-hidden relative">
                               {pub.video ? (
                                 <video 
                                   src={pub.video}
                                   autoPlay
                                   loop
                                   muted
                                   playsInline
                                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                 />
                               ) : (
                                 <img 
                                   src={pub.image} 
                                   alt={pub.title} 
                                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                 />
                               )}
                               <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-900 border border-neutral-200">
                                  {pub.year}
                               </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 flex flex-col flex-grow relative">
                               {/* Connector Line */}
                               <div className="absolute top-0 left-6 w-px h-6 bg-neutral-200 group-hover:h-full group-hover:bg-teal-500/20 transition-all duration-500"></div>

                               <div className="flex flex-wrap gap-2 mb-4 pl-4">
                                 {(Array.isArray(pub.tags) ? pub.tags : (pub.tags || '').split(',')).slice(0, 3).map((tag: string) => (
                                   <span key={tag} className="text-[10px] text-teal-600 font-mono uppercase tracking-wider bg-teal-50 px-1.5 py-0.5 rounded-sm">
                                     {tag}
                                   </span>
                                 ))}
                               </div>

                               <h3 className="text-xl font-serif text-neutral-900 mb-3 pl-4 leading-tight group-hover:text-teal-700 transition-colors">
                                  {pub.title}
                               </h3>
                               
                               <div className="mt-auto pl-4 border-l border-neutral-100 pt-4">
                                  <div className="flex justify-between items-end">
                                     <div className="text-neutral-400 text-xs font-mono">
                                        <span className="block text-neutral-500 mb-1">{pub.authors}</span>
                                        <span className="uppercase tracking-widest text-[9px]">{pub.journal}</span>
                                     </div>
                                     <div className="w-8 h-8 border border-neutral-200 flex items-center justify-center rounded-full group-hover:bg-teal-500 group-hover:border-teal-500 group-hover:text-white transition-all">
                                       <ArrowUpRight className="w-4 h-4" />
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                      )}
                   />
               </div>
               
               {filteredPublications.length === 0 && (
                  <div className="py-24 text-center">
                     <div className="inline-block p-4 border border-dashed border-neutral-300 rounded-full mb-4">
                        <Filter className="w-6 h-6 text-neutral-400" />
                     </div>
                     <p className="text-neutral-500 font-mono text-sm">No research found for these filters.</p>
                     <button 
                        onClick={() => {setSelectedYear('All'); setSelectedCategory('All');}}
                        className="mt-4 text-teal-600 hover:underline text-xs uppercase tracking-widest font-bold"
                      >
                        Clear Filters
                     </button>
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* Modal for Paper Details */}
      <AnimatePresence>
        {viewingPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPaper(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              layoutId={`pub-${viewingPaper.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden relative z-10 shadow-2xl flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setViewingPaper(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-neutral-900" />
              </button>

              {/* Media Section - Left Side (Landscape/Rectangular) */}
              <div className="w-full md:w-1/2 aspect-video md:aspect-auto md:h-auto bg-neutral-100 relative flex-shrink-0">
                {viewingPaper.video ? (
                  <video 
                    src={viewingPaper.video}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={viewingPaper.image} 
                    alt={viewingPaper.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-neutral-100">
                  {viewingPaper.year}
                </div>
              </div>

              {/* Content Section - Right Side */}
              <div className="flex-grow p-8 md:p-12 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(viewingPaper.tags) ? viewingPaper.tags : []).map((tag: any) => (
                        <span key={tag} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] uppercase tracking-wider border border-teal-100 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-4 leading-tight">
                      {viewingPaper.title}
                    </h2>

                    <div className="flex flex-col gap-1 font-mono text-xs text-neutral-500 mb-8 border-l-2 border-teal-500 pl-4 py-1">
                      <span className="text-neutral-900 font-bold">{viewingPaper.authors}</span>
                      <span>Published in {viewingPaper.journal}</span>
                    </div>

                    <div className="prose prose-neutral prose-sm max-w-none mb-8">
                      <div className="relative">
                        <div
                          ref={paperAbstractRef}
                          className={`transition-all ${
                            isPaperAbstractExpanded ? 'max-h-64 overflow-y-auto pr-2' : 'max-h-28 overflow-hidden'
                          }`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {viewingPaper.abstract?.trim() || 'No abstract available.'}
                          </ReactMarkdown>
                          <p className="text-neutral-600 leading-relaxed text-base mt-4">
                            {/* Simulated extended abstract for the demo since we only have short snippets */}
                            This research contributes significantly to the field by introducing novel methodologies and rigorous evaluation frameworks.
                            {` Our results demonstrate clear improvements over existing state-of-the-art solutions, opening new avenues for future investigation${
                              Array.isArray(viewingPaper.tags) && viewingPaper.tags.length > 0
                                ? ` in ${viewingPaper.tags.filter(Boolean).slice(0, 2).join(' and ')}`
                                : ''
                            }.`}
                          </p>
                        </div>

                        {!isPaperAbstractExpanded && hasPaperAbstractOverflow && (
                          <>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/95 to-transparent" />
                            <button
                              type="button"
                              onClick={() => setIsPaperAbstractExpanded(true)}
                              className="absolute bottom-1 right-1 font-mono text-sm text-teal-700 hover:text-teal-500 transition-colors"
                              aria-label="Show full abstract"
                            >
                              ...
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6 border-t border-neutral-100 flex gap-4 bg-white">
                  <button className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 hover:bg-teal-600 transition-all duration-300 uppercase text-xs font-bold tracking-widest flex-1 justify-center relative overflow-hidden group shadow-lg hover:shadow-2xl hover:shadow-teal-500/20">
                    <span className="absolute inset-0 w-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:w-full transition-all duration-700 ease-out"></span>
                    <FileText className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Read PDF</span>
                  </button>
                  <button className="flex items-center gap-2 border border-neutral-200 text-neutral-900 px-6 py-3 hover:bg-neutral-50 hover:border-teal-400 transition-all duration-300 uppercase text-xs font-bold tracking-widest flex-1 justify-center hover:shadow-md">
                     <Share2 className="w-4 h-4" />
                     Cite
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};