import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowUpRight, FileText, Share2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EditableContent } from './cms/EditableContent';
import { EditableCollection } from './cms/EditableCollection';
import { EditableLink } from './cms/EditableLink';
import { FeaturedProjectSelector } from './cms/FeaturedProjectSelector';
import { useCMS } from '../context/CMSContext';
import { ProjectCard } from './ProjectCard';

// All available projects - this should match the publications from Research.tsx
const allProjects = [
  {
    id: "01",
    title: "Haptic Feedback in Virtual Environments",
    authors: "L. Badr, M. Teyssier",
    year: "2025",
    journal: "CHI Conference",
    tags: ["Haptics", "VR", "HCI"],
    image: "https://images.unsplash.com/photo-1767716134807-646b08712f6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "02",
    title: "Swarm Intelligence for Disaster Recovery",
    authors: "T. Juldo, G. Musquet",
    year: "2025",
    journal: "IEEE Robotics",
    tags: ["Robotics", "AI", "Crisis"],
    image: "https://images.unsplash.com/photo-1610766456229-a613e4f93814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "03",
    title: "Ethical Frameworks for Generative AI",
    authors: "X. Xiao, S. Chen",
    year: "2024",
    journal: "NeurIPS",
    tags: ["AI Ethics", "Generative Art", "Policy"],
    image: "https://images.unsplash.com/photo-1647778977783-a8e03abc8dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "04",
    title: "Bio-Hybrid Interfaces: Art & Biology",
    authors: "V. Roussel, M. Teyssier",
    year: "2024",
    journal: "Leonardo Journal",
    tags: ["Bio-Design", "Art", "Interfaces"],
    image: "https://images.unsplash.com/photo-1737061365196-ea67128d64fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "05",
    title: "Geometric Data Structures for 3D Web",
    authors: "J. Wilson, A. Pradoura",
    year: "2023",
    journal: "WebGL Workshop",
    tags: ["Graphics", "Web", "Performance"],
    image: "https://images.unsplash.com/photo-1694500069324-d782decdd190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "06",
    title: "Neural Rendering for Real-Time Cinema",
    authors: "K. Lee, A. Schmidt",
    year: "2023",
    journal: "SIGGRAPH",
    tags: ["AI", "Graphics", "Cinema"],
    image: "https://images.unsplash.com/photo-1759270463243-414a287681be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "07",
    title: "Soft Robotics in Medical Diagnostics",
    authors: "M. Dubois, F. Pierre",
    year: "2022",
    journal: "Soft Robotics Journal",
    tags: ["Robotics", "Health", "Materials"],
    image: "https://images.unsplash.com/photo-1715059250871-08786b8a884a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "08",
    title: "Micro-Interactions in Augmented Reality",
    authors: "S. Tanaka, J. Doe",
    year: "2022",
    journal: "UIST",
    tags: ["AR", "HCI", "UX"],
    image: "https://images.unsplash.com/photo-1647083701139-3930542304cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  },
  {
    id: "09",
    title: "Data Visualization for Climate Action",
    authors: "R. Green, L. Earth",
    year: "2021",
    journal: "IEEE Vis",
    tags: ["Data Vis", "Climate", "Policy"],
    image: "https://images.unsplash.com/photo-1759661990336-51bd4b951fea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    video: ""
  }
];

export const FeaturedProjects = () => {
  const { getContent, isEditing } = useCMS();
  const cmsProjects = getContent('research-projects', allProjects) as typeof allProjects;
  const [viewingProject, setViewingProject] = React.useState<typeof allProjects[0] | null>(null);
  
  // Get selected project IDs from CMS (default to first 3)
  const selectedProjectIds = getContent('featured-project-ids', ['01', '02', '03']) as string[];
  
  // Filter projects based on selected IDs and maintain order
  const featuredProjects = selectedProjectIds
    .map(id => cmsProjects.find(p => p.id === id))
    .filter(Boolean) as typeof allProjects;

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (viewingProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingProject]);

  return (
    <section className="bg-white py-24 px-6 md:px-12 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <EditableContent 
            id="featured-projects-label"
            defaultContent="Research"
            enableProse={false}
            className="text-teal-600 text-xs font-mono tracking-widest uppercase mb-2 block [&_p]:m-0"
          />
          <EditableContent 
            id="featured-projects-title"
            defaultContent="Featured Projects"
            enableProse={false}
            className="text-4xl md:text-6xl font-serif text-neutral-900 tracking-tight [&_p]:m-0"
          />
          <EditableLink
            id="featured-projects-button-url"
            defaultHref="/research"
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-teal-600 transition-colors mt-6"
          >
            <EditableContent 
              id="featured-projects-button"
              defaultContent="View All Research"
              enableProse={false}
              multiline={false}
              secondaryId="featured-projects-button-url"
              secondaryDefault="/research"
              secondaryLabel="Redirection"
              secondaryPlaceholder="/research or https://..."
              className="[&_p]:m-0"
            />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </EditableLink>
        </div>

        <FeaturedProjectSelector
          allProjects={cmsProjects}
          contentId="featured-project-ids"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <div key={project.id} className="h-full pb-24">
              <ProjectCard 
                project={project} 
                index={index} 
                aspectRatio="landscape"
                variant="minimal"
                onClick={() => setViewingProject(project)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Project Details */}
      <AnimatePresence>
        {viewingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProject(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              layoutId={`pub-${viewingProject.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setViewingProject(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-neutral-900" />
              </button>

              {/* Media Section - Left Side (Landscape/Rectangular) */}
              <div className="w-full md:w-1/2 aspect-video md:aspect-auto md:h-auto bg-neutral-100 relative flex-shrink-0">
                {viewingProject.video ? (
                  <video 
                    src={viewingProject.video}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={viewingProject.image} 
                    alt={viewingProject.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-neutral-100">
                  {viewingProject.year}
                </div>
              </div>

              {/* Content Section - Right Side */}
              <div className="flex-grow p-8 md:p-12 flex flex-col overflow-y-auto">
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {viewingProject.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] uppercase tracking-wider border border-teal-100 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-4 leading-tight">
                    {viewingProject.title}
                  </h2>
                  
                  <div className="flex flex-col gap-1 font-mono text-xs text-neutral-500 mb-8 border-l-2 border-teal-500 pl-4 py-1">
                    <span className="text-neutral-900 font-bold">{viewingProject.authors}</span>
                    <span>Published in {viewingProject.journal}</span>
                  </div>

                  <div className="prose prose-neutral prose-sm max-w-none mb-8">
                    <p className="text-neutral-600 leading-relaxed text-base">
                      This groundbreaking research explores innovative approaches in {viewingProject.tags[0]}, pushing the boundaries of what's possible in {viewingProject.tags[1]}. 
                      Our work demonstrates significant advancements in methodology and practical applications, contributing to the broader field of {viewingProject.journal}.
                    </p>
                    <p className="text-neutral-600 leading-relaxed text-base mt-4">
                      Through rigorous experimentation and evaluation, we have developed novel frameworks that address key challenges in the domain. 
                      The results show promising improvements over existing state-of-the-art solutions, opening new avenues for future research and real-world implementation.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-neutral-100 flex gap-4">
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
    </section>
  );
};