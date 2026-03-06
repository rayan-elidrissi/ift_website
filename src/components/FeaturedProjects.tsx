import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { EditableContent } from './cms/EditableContent';
import { CardButtons } from './CardButtons';
import { EditableLink } from './cms/EditableLink';
import { FeaturedProjectSelector } from './cms/FeaturedProjectSelector';
import { useCMS } from '../context/CMSContext';
import { ProjectCard } from './ProjectCard';
import { buildFeaturedProjectPool, type UnifiedProject } from '../lib/featuredProjectUtils';
import { defaultPublications } from './Research';
import { defaultStudentProjects } from './Education';
import { defaultExhibitions } from './Arts';

export const FeaturedProjects = () => {
  const { getContent } = useCMS();
  const [viewingProject, setViewingProject] = React.useState<UnifiedProject | null>(null);

  // Fetch from all three CMS sources
  const publications = getContent('research-publications', defaultPublications) as typeof defaultPublications;
  const studentProjects = getContent('edu-student-projects', defaultStudentProjects) as typeof defaultStudentProjects;
  const exhibitions = getContent('arts-exhibitions', defaultExhibitions) as typeof defaultExhibitions;

  // Build unified pool from research publications, student projects, and art exhibitions
  const allProjects = React.useMemo(
    () => buildFeaturedProjectPool(publications, studentProjects, exhibitions),
    [publications, studentProjects, exhibitions]
  );

  // Get selected project IDs from CMS (default: one from each source)
  const defaultIds = ['pub-01', 'stu-p1', 'art-1'];
  const selectedProjectIds = getContent('featured-project-ids', defaultIds) as string[];

  // Filter projects based on selected IDs and maintain order
  const featuredProjects = selectedProjectIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter(Boolean) as UnifiedProject[];

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

  const getSourceLine = (p: UnifiedProject) => {
    if (p.sourceType === 'publication') return `Published in ${p.journal}`;
    if (p.sourceType === 'student') return p.journal;
    return `Exhibited at ${p.journal}`;
  };

  const getModalDescription = (p: UnifiedProject) => {
    const text = p.description || p.abstract;
    if (text) return text;
    const tags = Array.isArray(p.tags) ? p.tags : (p.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
    return `This project explores innovative approaches in ${tags[0] || 'technology'}, contributing to the broader field.`;
  };

  const getDefaultButtons = (p: UnifiedProject) => {
    if (p.sourceType === 'publication') return [{ label: 'Read PDF', primary: true }, { label: 'Cite', primary: false }];
    if (p.sourceType === 'art') return [{ label: 'View Portfolio', primary: true }, { label: 'Share', primary: false }];
    return [{ label: 'Learn More', primary: true }, { label: 'Share', primary: false }];
  };

  return (
    <section className="bg-white py-24 px-6 md:px-12 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <EditableContent
            id="featured-projects-label"
            defaultContent="Featured"
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
          allProjects={allProjects}
          contentId="featured-project-ids"
          defaultSelectedIds={defaultIds}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <div key={project.id} className="pb-24">
              <ProjectCard
                project={project}
                index={index}
                aspectRatio="square"
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
            layoutId={`project-${viewingProject.id}`}
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
                  {(Array.isArray(viewingProject.tags) ? viewingProject.tags : (viewingProject.tags || '').split(',')).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] uppercase tracking-wider border border-teal-100 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-4 leading-tight">
                  {viewingProject.title}
                </h2>

                <div className="flex flex-col gap-1 font-mono text-xs text-neutral-500 mb-8 border-l-2 border-teal-500 pl-4 py-1">
                  <span className="text-neutral-900 font-bold">{viewingProject.authors}</span>
                  <span>{getSourceLine(viewingProject)}</span>
                </div>

                <div className="prose prose-neutral prose-sm max-w-none mb-8">
                  <p className="text-neutral-600 leading-relaxed text-base">
                    {getModalDescription(viewingProject)}
                  </p>
                </div>

                {viewingProject.sourceType === 'art' && viewingProject.materials && (
                  <div className="bg-neutral-50 p-6 border border-neutral-100 mb-8">
                    <span className="block text-xs uppercase text-neutral-400 mb-2 font-mono">
                      Materials / Technologies
                    </span>
                    <p className="font-mono text-sm text-neutral-700">{viewingProject.materials}</p>
                  </div>
                )}
              </div>

              <CardButtons
                item={viewingProject}
                defaultButtons={getDefaultButtons(viewingProject)}
              />
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </section>
  );
};
