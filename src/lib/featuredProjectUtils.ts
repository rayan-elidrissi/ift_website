/**
 * Unifies research publications, student projects, and art exhibitions
 * into a single pool for Featured Projects on the home page.
 */

export type FeaturedProjectSource = 'publication' | 'student' | 'art';

export interface UnifiedProject {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  tags: string[];
  image: string;
  video?: string;
  sourceType: FeaturedProjectSource;
  description?: string;
  abstract?: string;
  materials?: string;
}

/** Normalize a research publication to unified format */
function normalizePublication(pub: {
  id: string;
  title: string;
  authors?: string;
  year?: string;
  journal?: string;
  tags?: string[];
  image?: string;
  abstract?: string;
}): UnifiedProject {
  return {
    id: `pub-${pub.id}`,
    title: pub.title,
    authors: pub.authors || '',
    year: pub.year || '',
    journal: pub.journal || '',
    tags: Array.isArray(pub.tags) ? pub.tags : [],
    image: pub.image || '',
    sourceType: 'publication',
    abstract: pub.abstract,
  };
}

/** Normalize a student project to unified format */
function normalizeStudentProject(proj: {
  id: string;
  title: string;
  student?: string;
  year?: string;
  image?: string;
  video?: string;
  tags?: string[];
  team?: string[];
  supervisor?: string | string[];
  description?: string;
}): UnifiedProject {
  const teamStr = Array.isArray(proj.team) ? proj.team.join(', ') : (typeof proj.team === 'string' ? proj.team : '');
  const supervisorStr = Array.isArray(proj.supervisor)
    ? proj.supervisor.join(', ')
    : typeof proj.supervisor === 'string' ? proj.supervisor : '';
  const authors = [teamStr, supervisorStr].filter(Boolean).join(' | ') || proj.student || '';
  return {
    id: `stu-${proj.id}`,
    title: proj.title,
    authors,
    year: proj.student || proj.year || '',
    journal: 'Student Project',
    tags: Array.isArray(proj.tags) ? proj.tags : [],
    image: proj.image || '',
    video: proj.video || '',
    sourceType: 'student',
    description: proj.description,
  };
}

/** Normalize an art exhibition to unified format */
function normalizeExhibition(exh: {
  id: number | string;
  title: string;
  artist?: string;
  year?: string;
  location?: string;
  image?: string;
  tags?: string[];
  description?: string;
  materials?: string;
}): UnifiedProject {
  return {
    id: `art-${exh.id}`,
    title: exh.title,
    authors: exh.artist || '',
    year: exh.year || '',
    journal: exh.location || '',
    tags: Array.isArray(exh.tags) ? exh.tags : [],
    image: exh.image || '',
    sourceType: 'art',
    description: exh.description,
    materials: exh.materials,
  };
}

export function buildFeaturedProjectPool(
  publications: Array<{
    id: string;
    title: string;
    authors?: string;
    year?: string;
    journal?: string;
    tags?: string[];
    image?: string;
    abstract?: string;
  }>,
  studentProjects: Array<{
    id: string;
    title: string;
    student?: string;
    year?: string;
    image?: string;
    video?: string;
    tags?: string[];
    team?: string[];
    supervisor?: string | string[];
    description?: string;
    visible?: string;
  }>,
  exhibitions: Array<{
    id: number | string;
    title: string;
    artist?: string;
    year?: string;
    location?: string;
    image?: string;
    tags?: string[];
    description?: string;
    materials?: string;
  }>
): UnifiedProject[] {
  const pubList = publications.map(normalizePublication);
  const stuList = studentProjects
    .filter((p) => (p.visible ?? 'shown') !== 'hidden')
    .map(normalizeStudentProject);
  const artList = exhibitions.map(normalizeExhibition);
  return [...pubList, ...stuList, ...artList];
}
