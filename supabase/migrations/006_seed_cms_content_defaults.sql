-- IFT: Seed default CMS content keys (text + collections)
-- Run in Supabase SQL Editor. Skips keys that already exist (hero-button, hero-button-url, hero-title).
-- Uses ON CONFLICT DO NOTHING to preserve existing content.

INSERT INTO public.cms_content (key, value, updated_at)
VALUES
  -- Hero (missing 2)
  ('hero-blurb', to_jsonb('A lab studio embedded in education, where students and researchers explore new forms of inquiry at the intersection of technology, human experience, and the natural world'::text), NOW()),
  ('hero-video-url', to_jsonb(''::text), NOW()),
  -- About
  ('about-title', to_jsonb('About'::text), NOW()),
  ('about-subtitle', to_jsonb('Institute for Future Technologies'::text), NOW()),
  ('about-intro', to_jsonb('The Institute for Future Technologies (IFT) at Pôle Léonard de Vinci is dedicated to inventing technologies that shape the future. We bridge the gap between engineering, management, and design to foster a unique ecosystem of innovation.'::text), NOW()),
  ('about-pillar-1-title', to_jsonb('Human-Centered Design'::text), NOW()),
  ('about-pillar-1-desc', to_jsonb('Focusing on technology that serves humanity and improves lives.'::text), NOW()),
  ('about-pillar-2-title', to_jsonb('Sustainable Future'::text), NOW()),
  ('about-pillar-2-desc', to_jsonb('Developing solutions with long-term environmental perspectives.'::text), NOW()),
  ('about-pillar-3-title', to_jsonb('Hands-on Learning'::text), NOW()),
  ('about-pillar-3-desc', to_jsonb('Learning by doing through our various labs and workshops.'::text), NOW()),
  ('about-campus-image', to_jsonb('https://placehold.co/800x600/f5f5f5/999?text=About'::text), NOW()),
  -- Team
  ('team-title-prefix', to_jsonb('The'::text), NOW()),
  ('team-title-highlight', to_jsonb('Team'::text), NOW()),
  ('team-subtitle', to_jsonb('Visionaries, Engineers, and Artists'::text), NOW()),
  ('team-members-core', '[]'::jsonb, NOW()),
  ('team-members-affiliated', '[]'::jsonb, NOW()),
  -- Research
  ('research-intro', to_jsonb('We explore the intersection of humanity and technology, designing systems that are not just functional, but meaningful, ethical, and sustainable.'::text), NOW()),
  ('research-themes', '[]'::jsonb, NOW()),
  ('research-publications', '[]'::jsonb, NOW()),
  -- Education
  ('edu-intro', to_jsonb('Where Engineering meets Design. We train the next generation of creative technologists to build the tools that shape the future.'::text), NOW()),
  ('edu-programs', '[]'::jsonb, NOW()),
  ('edu-philosophy-image', to_jsonb('https://placehold.co/800x600/f5f5f5/999?text=Philosophy'::text), NOW()),
  ('edu-phil-1-title', to_jsonb('Innovation & Autonomy'::text), NOW()),
  ('edu-phil-1', to_jsonb('One primary goal is to develop learning methods and strategies to foster autonomy. Every course''s evaluation is related to a project development: conducting research, large-scale manufacturing with a Kickstarter campaign, or developing disruptive innovations.'::text), NOW()),
  ('edu-phil-2-title', to_jsonb('Research-Led Groups'::text), NOW()),
  ('edu-phil-2', to_jsonb('Each student is part of an innovative group leaded by a Principal Investigator who follows their work on a daily basis. Our researchers come from MIT, Royal College of London, EPFL, Google, and Formlabs.'::text), NOW()),
  ('edu-phil-3-title', to_jsonb('Real-World Valorization'::text), NOW()),
  ('edu-phil-3', to_jsonb('Every student''s production is valorized in research publications, press communications, company partnerships, or startups. Inspired by the MIT Media Lab leitmotiv ''Demo or Die'', students maintain an operational project demonstration at all times.'::text), NOW()),
  ('edu-student-projects', '[]'::jsonb, NOW()),
  -- Arts
  ('arts-intro', to_jsonb('Curated exhibitions at the intersection of material reality and digital innovation. Exploring new aesthetics through code and sensors.'::text), NOW()),
  ('arts-exhibitions', '[]'::jsonb, NOW()),
  -- Events
  ('events-intro', to_jsonb('Join us for talks, festivals, and celebrations at the intersection of technology, art, and innovation.'::text), NOW()),
  ('events-talks', '[]'::jsonb, NOW()),
  ('events-festivals', '[]'::jsonb, NOW()),
  ('events-misc', '[]'::jsonb, NOW()),
  -- Collaborate
  ('collaborate-tagline', to_jsonb('Building the future together. Select your profile to discover how we can collaborate and create meaningful impact through technology.'::text), NOW()),
  ('collaborate-types', '[]'::jsonb, NOW()),
  ('collaborate-partners', '[]'::jsonb, NOW()),
  -- Featured Projects
  ('featured-projects-label', to_jsonb('Research'::text), NOW()),
  ('featured-projects-title', to_jsonb('Featured Projects'::text), NOW()),
  ('featured-projects-button', to_jsonb('View All Research'::text), NOW()),
  ('featured-project-ids', '["01","02","03"]'::jsonb, NOW()),
  ('research-projects', '[]'::jsonb, NOW()),
  -- Latest Events
  ('latest-events-label', to_jsonb('Agenda'::text), NOW()),
  ('latest-events-title', to_jsonb('Latest Events'::text), NOW()),
  ('latest-events-button', to_jsonb('View Full Calendar'::text), NOW()),
  ('latest-events', '[]'::jsonb, NOW()),
  -- Footer
  ('footer-location-title', to_jsonb('Location'::text), NOW()),
  ('footer-address-line1', to_jsonb('Pôle Léonard de Vinci'::text), NOW()),
  ('footer-address-line2', to_jsonb('92916 Paris La Défense'::text), NOW()),
  ('footer-address-line3', to_jsonb('France'::text), NOW()),
  ('footer-connect-title', to_jsonb('Connect'::text), NOW()),
  ('footer-email', to_jsonb('[contact@ift.devinci.fr](mailto:contact@ift.devinci.fr)'::text), NOW()),
  ('footer-legal-title', to_jsonb('Legal'::text), NOW()),
  ('footer-privacy-link', to_jsonb('[Privacy Policy](#)'::text), NOW()),
  ('footer-terms-link', to_jsonb('[Terms of Use](#)'::text), NOW()),
  ('footer-copyright', to_jsonb('© 2026 IFT. All Rights Reserved.'::text), NOW()),
  ('footer-social-twitter', to_jsonb('#'::text), NOW()),
  ('footer-social-linkedin', to_jsonb('#'::text), NOW()),
  ('footer-social-instagram', to_jsonb('#'::text), NOW()),
  ('footer-social-github', to_jsonb('#'::text), NOW())
ON CONFLICT (key) DO NOTHING;
