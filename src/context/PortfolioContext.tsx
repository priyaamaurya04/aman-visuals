import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ref,
  set,
  get,
  onValue,
  update,
  remove,
} from 'firebase/database';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { rtdb, auth, googleProvider } from '../lib/firebase';
import {
  PROJECTS as DEFAULT_PROJECTS,
  REELS as DEFAULT_REELS,
  HERO_SHOWREEL_URL as DEFAULT_SHOWREEL_URL,
  HERO_SHOWREEL_POSTER as DEFAULT_HERO_POSTER,
  ABOUT_AMAN as DEFAULT_ABOUT,
  SKILLS as DEFAULT_SKILLS,
  SOFTWARE_TOOLS as DEFAULT_SOFTWARE,
  TIMELINE_STAGES as DEFAULT_TIMELINE,
  PROCESS_STEPS as DEFAULT_PROCESS,
} from '../data/portfolioData';
import { Project, ReelItem, TimelineStage, SkillItem, SoftwareTool, ProcessStep } from '../types';
import localVideoFiles from 'virtual:local-videos';
import { rehydrateReelsWithStoredVideos, removeStoredVideo } from '../utils/videoStorage';
import { uploadReelVideoToFirebase, fetchReelVideoFromFirebase } from '../utils/firebaseVideoSync';

const STORAGE_CACHE_KEY_ITEMS = 'aman_gupta_portfolio_custom_items';
const STORAGE_CACHE_KEY_SECTIONS = 'aman_gupta_site_settings_v3';

export interface HeroContent {
  badge: string;
  name: string;
  title: string;
  headline: string;
  subheadline: string;
  videoUrl: string;
  posterUrl: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
  ctaReelText: string;
  ctaWorkText: string;
}

export interface AboutContent {
  headline: string;
  subheadline: string;
  biography: string;
  portraitUrl: string;
  location: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
  specializations: string[];
}

export interface ContactContent {
  headline: string;
  subheadline: string;
  email: string;
  phone: string;
  location: string;
  statusBadge: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  behance?: string;
}

export interface FirestorePortfolioItem {
  id: string;
  itemType: 'showreel' | 'project' | 'reel';
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  client?: string;
  role?: string;
  aspectRatio?: string;
  tagline?: string;
  category?: string;
  year?: string;
  duration?: string;
  isBase64?: boolean;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface SaveResult {
  syncedToCloud: boolean;
  message: string;
}

export const INITIAL_HERO_CONTENT: HeroContent = {
  badge: 'VIDEO EDITOR / MOTION DESIGNER',
  name: 'AMAN VISUALS',
  title: 'LEAD VIDEO EDITOR & VISUAL STORYTELLER',
  headline: 'I EDIT STORIES THAT DESERVE TO BE REMEMBERED.',
  subheadline: 'Crafting narrative-driven commercial films, automotive kinetics, and festival cinema through relentless rhythmic precision.',
  videoUrl: DEFAULT_SHOWREEL_URL,
  posterUrl: DEFAULT_HERO_POSTER,
  stat1Value: '45M+',
  stat1Label: 'TOTAL REACH',
  stat2Value: '120+',
  stat2Label: 'COMMERCIALS & FILMS',
  stat3Value: '7+ YRS',
  stat3Label: 'MASTERING TIMELINES',
  stat4Value: '14',
  stat4Label: 'FESTIVAL LAURELS',
  ctaReelText: 'PLAY 2025 SHOWREEL',
  ctaWorkText: 'EXPLORE WORK',
};

export const INITIAL_ABOUT_CONTENT: AboutContent = {
  headline: DEFAULT_ABOUT.headline,
  subheadline: DEFAULT_ABOUT.subheadline,
  biography: DEFAULT_ABOUT.biography,
  portraitUrl: DEFAULT_ABOUT.portraitUrl,
  location: DEFAULT_ABOUT.location,
  stat1Value: DEFAULT_ABOUT.stats[0]?.value || '120+',
  stat1Label: DEFAULT_ABOUT.stats[0]?.label || 'Commercials & Films',
  stat2Value: DEFAULT_ABOUT.stats[1]?.value || '7',
  stat2Label: DEFAULT_ABOUT.stats[1]?.label || 'Years of Craft',
  stat3Value: DEFAULT_ABOUT.stats[2]?.value || '45',
  stat3Label: DEFAULT_ABOUT.stats[2]?.label || 'Global Views',
  stat4Value: DEFAULT_ABOUT.stats[3]?.value || '14',
  stat4Label: DEFAULT_ABOUT.stats[3]?.label || 'Festival Selections',
  specializations: [...DEFAULT_ABOUT.specializations],
};

export const INITIAL_CONTACT_CONTENT: ContactContent = {
  headline: "LET'S BUILD SOMETHING CINEMATIC.",
  subheadline: 'Open for director commissions, agency partnerships, brand campaigns, and post-production supervision.',
  email: 'aman.gupta.edits@gmail.com',
  phone: '+91 98765 43210',
  location: 'Mumbai, India • Available Worldwide (Remote & On-Set)',
  statusBadge: 'AVAILABLE FOR SELECT COMMISSIONS',
  instagram: 'https://instagram.com/amangupta.edits',
  linkedin: 'https://linkedin.com/in/amangupta-editor',
  youtube: 'https://youtube.com/@AmanGuptaStoryteller',
  behance: 'https://behance.net/amanguptacuts',
};

export function isDummyVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('/videos/hero-showreel') ||
    lower.includes('/videos/project-') ||
    lower.includes('/videos/reel-') ||
    lower.includes('assets.mixkit.co') ||
    lower.includes('mixkit.co') ||
    lower.includes('w3schools.com') ||
    lower.includes('wikimedia.org')
  );
}

export function isDummyImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('images.unsplash.com') || lower.includes('unsplash.com');
}

const DUMMY_PROJECT_IDS = new Set([
  '01-brand-film',
  '02-commercial',
  '03-social-campaign',
  '04-music-video',
  '05-youtube',
  '06-short-film',
]);

const DUMMY_REEL_IDS = new Set([
  'reel-01',
  'reel-02',
  'reel-03',
  'reel-04',
  'reel-05',
]);

export function isDummyProject(p?: Partial<Project> | null): boolean {
  if (!p) return true;
  if (p.id && DUMMY_PROJECT_IDS.has(p.id) && (!p.videoUrl || isDummyVideoUrl(p.videoUrl))) {
    return true;
  }
  if (isDummyVideoUrl(p.videoUrl)) {
    return true;
  }
  return false;
}

export function isDummyReel(r?: Partial<ReelItem> | null): boolean {
  if (!r) return true;
  if (r.id && DUMMY_REEL_IDS.has(r.id) && (!r.videoUrl || isDummyVideoUrl(r.videoUrl))) {
    return true;
  }
  if (!r.videoUrl || isDummyVideoUrl(r.videoUrl)) {
    return true;
  }
  return false;
}

export function mergeHeroContent(base: HeroContent, incoming?: Partial<HeroContent> | null): HeroContent {
  const merged = { ...base, ...(incoming || {}) };
  const rawVideo = merged.videoUrl ?? base.videoUrl ?? '';
  const rawPoster = merged.posterUrl ?? base.posterUrl ?? '';
  return {
    badge: merged.badge ?? base.badge ?? '',
    name: merged.name ?? base.name ?? '',
    title: merged.title ?? base.title ?? '',
    headline: merged.headline ?? base.headline ?? '',
    subheadline: merged.subheadline ?? base.subheadline ?? '',
    videoUrl: isDummyVideoUrl(rawVideo) ? '' : rawVideo,
    posterUrl: isDummyImageUrl(rawPoster) ? '' : rawPoster,
    stat1Value: merged.stat1Value ?? base.stat1Value ?? '',
    stat1Label: merged.stat1Label ?? base.stat1Label ?? '',
    stat2Value: merged.stat2Value ?? base.stat2Value ?? '',
    stat2Label: merged.stat2Label ?? base.stat2Label ?? '',
    stat3Value: merged.stat3Value ?? base.stat3Value ?? '',
    stat3Label: merged.stat3Label ?? base.stat3Label ?? '',
    stat4Value: merged.stat4Value ?? base.stat4Value ?? '',
    stat4Label: merged.stat4Label ?? base.stat4Label ?? '',
    ctaReelText: merged.ctaReelText ?? base.ctaReelText ?? '',
    ctaWorkText: merged.ctaWorkText ?? base.ctaWorkText ?? '',
  };
}

export function mergeAboutContent(base: AboutContent, incoming?: Partial<AboutContent> | null): AboutContent {
  const merged = { ...base, ...(incoming || {}) };
  const rawPortrait = merged.portraitUrl ?? base.portraitUrl ?? '';
  return {
    headline: merged.headline ?? base.headline ?? '',
    subheadline: merged.subheadline ?? base.subheadline ?? '',
    biography: merged.biography ?? base.biography ?? '',
    portraitUrl: isDummyImageUrl(rawPortrait) ? '' : rawPortrait,
    location: merged.location ?? base.location ?? '',
    stat1Value: merged.stat1Value ?? base.stat1Value ?? '',
    stat1Label: merged.stat1Label ?? base.stat1Label ?? '',
    stat2Value: merged.stat2Value ?? base.stat2Value ?? '',
    stat2Label: merged.stat2Label ?? base.stat2Label ?? '',
    stat3Value: merged.stat3Value ?? base.stat3Value ?? '',
    stat3Label: merged.stat3Label ?? base.stat3Label ?? '',
    stat4Value: merged.stat4Value ?? base.stat4Value ?? '',
    stat4Label: merged.stat4Label ?? base.stat4Label ?? '',
    specializations: Array.isArray(merged.specializations) ? merged.specializations : (base.specializations || []),
  };
}

export function mergeContactContent(base: ContactContent, incoming?: Partial<ContactContent> | null): ContactContent {
  const merged = { ...base, ...(incoming || {}) };
  return {
    headline: merged.headline ?? base.headline ?? '',
    subheadline: merged.subheadline ?? base.subheadline ?? '',
    email: merged.email ?? base.email ?? '',
    phone: merged.phone ?? base.phone ?? '',
    location: merged.location ?? base.location ?? '',
    statusBadge: merged.statusBadge ?? base.statusBadge ?? '',
    instagram: merged.instagram ?? base.instagram ?? '',
    linkedin: merged.linkedin ?? base.linkedin ?? '',
    youtube: merged.youtube ?? base.youtube ?? '',
    behance: merged.behance ?? base.behance ?? '',
  };
}

export function sanitizeProject(p: Partial<Project>, defaultP?: Project): Project {
  const rawVideo = p.videoUrl ?? defaultP?.videoUrl ?? '';
  const rawPoster = p.posterUrl ?? defaultP?.posterUrl ?? '';
  const rawLogImg = p.caseStudy?.colorGrading?.logImage ?? defaultP?.caseStudy?.colorGrading?.logImage ?? '';
  const rawRecImg = p.caseStudy?.colorGrading?.rec709Image ?? defaultP?.caseStudy?.colorGrading?.rec709Image ?? '';
  return {
    id: p.id || defaultP?.id || `proj-${Date.now()}`,
    number: p.number ?? defaultP?.number ?? '01',
    title: p.title ?? defaultP?.title ?? '',
    client: p.client ?? defaultP?.client ?? '',
    year: p.year ?? defaultP?.year ?? '',
    category: p.category ?? defaultP?.category ?? '',
    role: p.role ?? defaultP?.role ?? '',
    duration: p.duration ?? defaultP?.duration ?? '',
    aspect: p.aspect ?? defaultP?.aspect ?? '16:9 Cinema',
    videoUrl: isDummyVideoUrl(rawVideo) ? '' : rawVideo,
    posterUrl: isDummyImageUrl(rawPoster) ? '' : rawPoster,
    tagline: p.tagline ?? defaultP?.tagline ?? '',
    tools: Array.isArray(p.tools) ? p.tools : (defaultP?.tools || []),
    caseStudy: {
      creativeDirection: p.caseStudy?.creativeDirection ?? defaultP?.caseStudy?.creativeDirection ?? '',
      editingProcess: p.caseStudy?.editingProcess ?? defaultP?.caseStudy?.editingProcess ?? '',
      motionDesign: p.caseStudy?.motionDesign ?? defaultP?.caseStudy?.motionDesign ?? '',
      colorGrading: {
        logImage: isDummyImageUrl(rawLogImg) ? '' : rawLogImg,
        rec709Image: isDummyImageUrl(rawRecImg) ? '' : rawRecImg,
        lutName: p.caseStudy?.colorGrading?.lutName ?? defaultP?.caseStudy?.colorGrading?.lutName ?? '',
        notes: p.caseStudy?.colorGrading?.notes ?? defaultP?.caseStudy?.colorGrading?.notes ?? '',
      },
      soundDesign: {
        stems: Array.isArray(p.caseStudy?.soundDesign?.stems) ? p.caseStudy.soundDesign.stems : (defaultP?.caseStudy?.soundDesign?.stems || []),
        notes: p.caseStudy?.soundDesign?.notes ?? defaultP?.caseStudy?.soundDesign?.notes ?? '',
      },
      finalCutSpecs: {
        resolution: p.caseStudy?.finalCutSpecs?.resolution ?? defaultP?.caseStudy?.finalCutSpecs?.resolution ?? '',
        fps: p.caseStudy?.finalCutSpecs?.fps ?? defaultP?.caseStudy?.finalCutSpecs?.fps ?? '',
        codec: p.caseStudy?.finalCutSpecs?.codec ?? defaultP?.caseStudy?.finalCutSpecs?.codec ?? '',
        runtime: p.caseStudy?.finalCutSpecs?.runtime ?? defaultP?.caseStudy?.finalCutSpecs?.runtime ?? '',
        aspectRatio: p.caseStudy?.finalCutSpecs?.aspectRatio ?? defaultP?.caseStudy?.finalCutSpecs?.aspectRatio ?? '',
      },
    },
  };
}

interface PortfolioContextType {
  currentUser: User | null;
  authLoading: boolean;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  
  // Realtime Database connection state
  rtdbConnected: boolean;
  rtdbUrl: string;

  // Site Content
  heroContent: HeroContent;
  updateHeroContent: (patch: Partial<HeroContent>) => void;
  
  aboutContent: AboutContent;
  updateAboutContent: (patch: Partial<AboutContent>) => void;
  
  contactContent: ContactContent;
  updateContactContent: (patch: Partial<ContactContent>) => void;
  
  projects: Project[];
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  reels: ReelItem[];
  updateReel: (id: string, patch: Partial<ReelItem>) => void;
  addReel: (reel: ReelItem) => void;
  deleteReel: (id: string) => void;

  skills: SkillItem[];
  updateSkill: (index: number, patch: Partial<SkillItem>) => void;
  addSkill: (skill: SkillItem) => void;
  deleteSkill: (index: number) => void;

  softwareTools: SoftwareTool[];
  updateSoftwareTool: (index: number, patch: Partial<SoftwareTool>) => void;

  timelineStages: TimelineStage[];
  updateTimelineStage: (index: number, patch: Partial<TimelineStage>) => void;

  processSteps: ProcessStep[];
  updateProcessStep: (index: number, patch: Partial<ProcessStep>) => void;

  // Showreel & backward compatibility
  showreelUrl: string;
  showreelData: FirestorePortfolioItem | null;
  customItems: Record<string, FirestorePortfolioItem>;
  isSyncing: boolean;
  savePortfolioItem: (item: {
    id: string;
    itemType: 'showreel' | 'project';
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    client?: string;
    role?: string;
    aspectRatio?: string;
    tagline?: string;
  }) => Promise<SaveResult>;
  resetPortfolioItem: (id: string) => Promise<void>;

  // Global Actions
  saveAllSettings: () => Promise<SaveResult>;
  resetSectionToDefault: (sectionKey: 'hero' | 'about' | 'contact' | 'projects' | 'skills' | 'software' | 'timeline' | 'process') => void;
  resetAllToDefaults: () => void;
  exportSettingsJson: () => string;
  importSettingsJson: (jsonString: string) => { success: boolean; message: string };
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [rtdbConnected, setRtdbConnected] = useState<boolean>(false);
  const rtdbUrl = 'https://aman-portfolio-f7222-default-rtdb.firebaseio.com';

  // Initialize custom items from localStorage
  const [customItems, setCustomItems] = useState<Record<string, FirestorePortfolioItem>>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY_ITEMS);
      if (cached) return JSON.parse(cached);
    } catch {}
    return {};
  });

  // Cached Section Content
  const [heroContent, setHeroContent] = useState<HeroContent>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_hero`);
      if (cached) {
        const merged = mergeHeroContent(INITIAL_HERO_CONTENT, JSON.parse(cached));
        if (merged.videoUrl?.includes('mixkit')) {
          merged.videoUrl = DEFAULT_SHOWREEL_URL;
        }
        return merged;
      }
    } catch {}
    return INITIAL_HERO_CONTENT;
  });

  const [aboutContent, setAboutContent] = useState<AboutContent>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_about`);
      if (cached) return mergeAboutContent(INITIAL_ABOUT_CONTENT, JSON.parse(cached));
    } catch {}
    return INITIAL_ABOUT_CONTENT;
  });

  const [contactContent, setContactContent] = useState<ContactContent>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_contact`);
      if (cached) return mergeContactContent(INITIAL_CONTACT_CONTENT, JSON.parse(cached));
    } catch {}
    return INITIAL_CONTACT_CONTENT;
  });

  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_projects`);
      if (cached) {
        const parsed: Project[] = JSON.parse(cached);
        return parsed
          .filter((p) => p && !p.id.startsWith('reel-') && p.category !== 'VERTICAL REEL' && !isDummyProject(p))
          .map((p) => sanitizeProject(p));
      }
    } catch {}
    return [];
  });

  const [reelsList, setReelsList] = useState<ReelItem[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_reels`);
      if (cached) {
        const parsed: ReelItem[] = JSON.parse(cached);
        return parsed
          .filter((r) => !isDummyReel(r))
          .map((r) => ({
            ...r,
            posterUrl: isDummyImageUrl(r.posterUrl) ? undefined : r.posterUrl,
          }));
      }
    } catch {}
    return [];
  });

  const [skillsList, setSkillsList] = useState<SkillItem[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_skills`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_SKILLS;
  });

  const [softwareList, setSoftwareList] = useState<SoftwareTool[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_software`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_SOFTWARE;
  });

  const [timelineList, setTimelineList] = useState<TimelineStage[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_timeline`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_TIMELINE;
  });

  const [processList, setProcessList] = useState<ProcessStep[]>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_CACHE_KEY_SECTIONS}_process`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_PROCESS;
  });

// Helper to recursively remove undefined properties before writing to Firebase Realtime Database
// (Firebase RTDB throws an uncaught error if any key has value undefined)
function cleanForFirebase<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  return JSON.parse(JSON.stringify(data));
}

function sanitizeReelForRtdb(reel: ReelItem): Record<string, unknown> {
  const isChunked = reel.videoUrl?.startsWith('firebase-chunked://');
  const isBase64 = reel.isBase64 || reel.videoUrl?.startsWith('data:video/') || (reel.videoUrl && reel.videoUrl.length > 500 && !reel.videoUrl.startsWith('http'));
  const isTooLargeForSingleNode = reel.videoUrl && reel.videoUrl.length > 6000000;

  let safeVideoUrl = reel.videoUrl;
  if (isTooLargeForSingleNode && !isChunked) {
    safeVideoUrl = `firebase-chunked://${reel.id}`;
  }

  const payload: Record<string, unknown> = {
    id: reel.id,
    number: reel.number,
    title: reel.title,
    client: reel.client || 'Social / Vertical Client',
    duration: reel.duration || '00:15',
    aspect: reel.aspect || '9:16',
    videoUrl: safeVideoUrl,
    uploadedAt: reel.uploadedAt || new Date().toISOString(),
  };

  if (reel.fileName) payload.fileName = reel.fileName;
  if (reel.fileSize) payload.fileSize = reel.fileSize;
  if (isBase64 || isChunked) payload.isBase64 = true;
  if (isChunked || isTooLargeForSingleNode) payload.isCloudChunked = true;
  if (reel.base64Video && reel.base64Video.length <= 6000000) {
    payload.base64Video = reel.base64Video;
  }

  return cleanForFirebase(payload);
}

  // Local persistence helpers
  const persistItemsLocally = (newItems: Record<string, FirestorePortfolioItem>) => {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY_ITEMS, JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save portfolio items to localStorage:', e);
    }
  };

  const persistSectionLocally = (section: string, data: unknown) => {
    try {
      if (section === 'reels' && Array.isArray(data)) {
        // Strip large base64 or blob URLs from localStorage payload to avoid QuotaExceededError
        const sanitized = data.map((r: ReelItem) => {
          const isHuge = (r.videoUrl && r.videoUrl.length > 5000) || r.base64Video;
          const isBlob = r.videoUrl && r.videoUrl.startsWith('blob:');
          if (isHuge || isBlob || r.hasStoredBlob) {
            return {
              ...r,
              videoUrl: r.hasStoredBlob ? `idb://${r.id}` : (isBlob ? `idb://${r.id}` : r.videoUrl.slice(0, 100)),
              base64Video: undefined,
            };
          }
          return r;
        });
        localStorage.setItem(`${STORAGE_CACHE_KEY_SECTIONS}_${section}`, JSON.stringify(sanitized));
        return;
      }
      localStorage.setItem(`${STORAGE_CACHE_KEY_SECTIONS}_${section}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to save ${section} to localStorage:`, e);
    }
  };

  // Rehydrate stored video files from IndexedDB on initial mount
  useEffect(() => {
    rehydrateReelsWithStoredVideos(reelsList).then((rehydrated) => {
      setReelsList(rehydrated);
    });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Realtime Database for all portfolio data updates
  useEffect(() => {
    const portfolioRef = ref(rtdb, 'portfolio');

    const unsubscribe = onValue(
      portfolioRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRtdbConnected(true);
          return;
        }

        setRtdbConnected(true);
        const data = snapshot.val();

        if (data.hero) {
          setHeroContent((prev) => {
            const next = mergeHeroContent(prev, data.hero);
            persistSectionLocally('hero', next);
            return next;
          });
        }

        if (data.about) {
          setAboutContent((prev) => {
            const next = mergeAboutContent(prev, data.about);
            persistSectionLocally('about', next);
            return next;
          });
        }

        if (data.contact) {
          setContactContent((prev) => {
            const next = mergeContactContent(prev, data.contact);
            persistSectionLocally('contact', next);
            return next;
          });
        }

        if (data.projects) {
          const raw = data.projects;
          const projectsArr: Project[] = Array.isArray(raw)
            ? raw.filter(Boolean)
            : Object.values(raw);
          const sanitized = projectsArr
            .filter((p) => p && !p.id.startsWith('reel-') && p.category !== 'VERTICAL REEL' && !isDummyProject(p))
            .map((p) => sanitizeProject(p))
            .filter((p) => !isDummyProject(p));
          setProjectsList(sanitized);
          persistSectionLocally('projects', sanitized);
        } else {
          // If the user has non-dummy projects locally in this browser that haven't synced to RTDB yet, push them to RTDB
          setProjectsList((prev) => {
            const validLocal = prev.filter((p) => p && !isDummyProject(p));
            if (validLocal.length > 0) {
              const projectsMap: Record<string, unknown> = {};
              validLocal.forEach((p) => {
                projectsMap[p.id] = cleanForFirebase(p);
              });
              set(ref(rtdb, 'portfolio/projects'), projectsMap).catch(() => {});
              return validLocal;
            }
            persistSectionLocally('projects', []);
            return [];
          });
        }

        // Realtime sync for Vertical Reels (rehydrated from Firebase Cloud and local vault)
        if (data.reels) {
          const raw = data.reels;
          const reelsArr: ReelItem[] = (Array.isArray(raw)
            ? raw.filter(Boolean)
            : (Object.values(raw) as ReelItem[])
          ).filter((r) => !isDummyReel(r));
          if (reelsArr.length > 0) {
            Promise.all(
              reelsArr.map(async (reel) => {
                const cleanReel = {
                  ...reel,
                  posterUrl: isDummyImageUrl(reel.posterUrl) ? undefined : reel.posterUrl,
                };
                if (cleanReel.videoUrl?.startsWith('firebase-chunked://') || (cleanReel as any).isCloudChunked) {
                  const cloudUrl = await fetchReelVideoFromFirebase(cleanReel.id, cleanReel.videoUrl);
                  if (cloudUrl) {
                    return { ...cleanReel, videoUrl: cloudUrl, isBase64: true };
                  }
                }
                return cleanReel;
              })
            ).then((cloudHydrated) => {
              rehydrateReelsWithStoredVideos(cloudHydrated).then((rehydrated) => {
                setReelsList(rehydrated);
                persistSectionLocally('reels', rehydrated);
              });
            });
          } else {
            setReelsList([]);
            persistSectionLocally('reels', []);
          }
        } else {
          // If local browser has valid reels not yet in RTDB, push them to RTDB so all visitors see them
          setReelsList((prev) => {
            const validLocal = prev.filter((r) => r && !isDummyReel(r) && !r.videoUrl?.startsWith('blob:'));
            if (validLocal.length > 0) {
              const reelsMap: Record<string, unknown> = {};
              validLocal.forEach((r) => {
                reelsMap[r.id] = sanitizeReelForRtdb(r);
              });
              set(ref(rtdb, 'portfolio/reels'), reelsMap).catch(() => {});
              return validLocal;
            }
            persistSectionLocally('reels', []);
            return [];
          });
        }

        if (data.skills) {
          const skillsArr: SkillItem[] = Array.isArray(data.skills)
            ? data.skills.filter(Boolean)
            : Object.values(data.skills);
          if (skillsArr.length > 0) {
            setSkillsList(skillsArr);
            persistSectionLocally('skills', skillsArr);
          }
        }

        if (data.software) {
          const softwareArr: SoftwareTool[] = Array.isArray(data.software)
            ? data.software.filter(Boolean)
            : Object.values(data.software);
          if (softwareArr.length > 0) {
            setSoftwareList(softwareArr);
            persistSectionLocally('software', softwareArr);
          }
        }

        if (data.timeline) {
          const timelineArr: TimelineStage[] = Array.isArray(data.timeline)
            ? data.timeline.filter(Boolean)
            : Object.values(data.timeline);
          if (timelineArr.length > 0) {
            setTimelineList(timelineArr);
            persistSectionLocally('timeline', timelineArr);
          }
        }

        if (data.process) {
          const processArr: ProcessStep[] = Array.isArray(data.process)
            ? data.process.filter(Boolean)
            : Object.values(data.process);
          if (processArr.length > 0) {
            setProcessList(processArr);
            persistSectionLocally('process', processArr);
          }
        }

        if (data.customItems) {
          setCustomItems((prev) => {
            const next = { ...prev, ...data.customItems };
            persistItemsLocally(next);
            return next;
          });
        }
      },
      (error) => {
        console.warn('Realtime Database sync notice:', error.message);
        setRtdbConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute active showreel URL (strip any dummy video URL)
  const showreelData = customItems['showreel'] || null;
  const rawShowreelUrl = showreelData?.videoUrl?.trim() || heroContent.videoUrl || DEFAULT_SHOWREEL_URL;
  const showreelUrl = isDummyVideoUrl(rawShowreelUrl) ? '' : rawShowreelUrl;

  // Merged projects: only real projects, excluding dummy stock items
  const effectiveProjects: Project[] = projectsList
    .filter((proj) => !proj.id.startsWith('reel-') && proj.category !== 'VERTICAL REEL' && !isDummyProject(proj))
    .map((proj) => {
      const override = customItems[proj.id];
      if (!override) return sanitizeProject(proj);
      return sanitizeProject(
        {
          ...proj,
          title: override.title || proj.title,
          videoUrl: override.videoUrl || proj.videoUrl,
          client: override.client || proj.client,
          role: override.role || proj.role,
          posterUrl: override.thumbnailUrl || proj.posterUrl,
          aspect: override.aspectRatio || proj.aspect,
          tagline: override.tagline || proj.tagline,
          category: override.category || proj.category,
          year: override.year || proj.year,
          duration: override.duration || proj.duration,
        },
        proj
      );
    })
    .filter((proj) => !isDummyProject(proj));

  // Vertical reels: one per video file in public/videos (see localVideosPlugin in vite.config.ts).
  const effectiveReels: ReelItem[] = localVideoFiles.map((file, idx) => ({
    id: `local-${file}`,
    number: String(idx + 1).padStart(2, '0'),
    title: file.replace(/\.[^.]+$/, '').toUpperCase(),
    videoUrl: `/videos/${encodeURIComponent(file)}`,
    aspect: '9:16',
    client: 'Social / Vertical Client',
    fileName: file,
  }));

  // Updaters with direct RTDB sync
  const updateHeroContent = (patch: Partial<HeroContent>) => {
    setHeroContent((prev) => {
      const updated = mergeHeroContent(prev, patch);
      persistSectionLocally('hero', updated);
      update(ref(rtdb, 'portfolio/hero'), cleanForFirebase(patch)).catch((e) => {
        console.warn('Hero partial update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateAboutContent = (patch: Partial<AboutContent>) => {
    setAboutContent((prev) => {
      const updated = mergeAboutContent(prev, patch);
      persistSectionLocally('about', updated);
      update(ref(rtdb, 'portfolio/about'), cleanForFirebase(patch)).catch((e) => {
        console.warn('About partial update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateContactContent = (patch: Partial<ContactContent>) => {
    setContactContent((prev) => {
      const updated = mergeContactContent(prev, patch);
      persistSectionLocally('contact', updated);
      update(ref(rtdb, 'portfolio/contact'), cleanForFirebase(patch)).catch((e) => {
        console.warn('Contact partial update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjectsList((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      persistSectionLocally('projects', updated);
      const targetProject = updated.find((p) => p.id === id);
      if (targetProject) {
        set(ref(rtdb, `portfolio/projects/${id}`), cleanForFirebase(targetProject)).catch((e) => {
          console.warn('Project update to RTDB notice:', e.message);
        });
      }
      return updated;
    });

    // Keep the override layer in sync, including when a field is cleared to '' —
    // otherwise a stale override value would be merged back over the edited project.
    const overridePatch: Partial<FirestorePortfolioItem> = {};
    if (patch.title !== undefined) overridePatch.title = patch.title;
    if (patch.videoUrl !== undefined) overridePatch.videoUrl = patch.videoUrl;
    if (patch.posterUrl !== undefined) overridePatch.thumbnailUrl = patch.posterUrl;
    if (patch.client !== undefined) overridePatch.client = patch.client;
    if (patch.role !== undefined) overridePatch.role = patch.role;
    if (patch.aspect !== undefined) overridePatch.aspectRatio = patch.aspect;
    if (patch.tagline !== undefined) overridePatch.tagline = patch.tagline;
    if (patch.category !== undefined) overridePatch.category = patch.category;
    if (patch.year !== undefined) overridePatch.year = patch.year;
    if (patch.duration !== undefined) overridePatch.duration = patch.duration;

    if (Object.keys(overridePatch).length > 0) {
      setCustomItems((prev) => {
        const hadOverride = Boolean(prev[id]);
        const existing = prev[id] || {
          id,
          itemType: 'project',
          title: patch.title ?? '',
          videoUrl: patch.videoUrl ?? '',
          updatedBy: auth.currentUser?.uid || 'guest-editor-local',
        };
        const nextItem: FirestorePortfolioItem = { ...existing, ...overridePatch };
        const next = { ...prev, [id]: nextItem };
        persistItemsLocally(next);
        // A cloud override may exist for this project; update it too so the next
        // realtime snapshot doesn't restore the old value.
        if (hadOverride) {
          update(ref(rtdb, `portfolio/customItems/${id}`), cleanForFirebase(overridePatch)).catch(() => {});
        }
        return next;
      });
    }
  };

  const addProject = (project: Project) => {
    setProjectsList((prev) => {
      const updated = [project, ...prev];
      persistSectionLocally('projects', updated);
      set(ref(rtdb, `portfolio/projects/${project.id}`), cleanForFirebase(project)).catch((e) => {
        console.warn('Project addition to RTDB notice:', e.message);
      });
      return updated;
    });
    setCustomItems((prev) => {
      const nextItem: FirestorePortfolioItem = {
        id: project.id,
        itemType: 'project',
        title: project.title,
        videoUrl: project.videoUrl,
        thumbnailUrl: project.posterUrl,
        client: project.client,
        role: project.role,
        aspectRatio: project.aspect,
        tagline: project.tagline,
        updatedBy: auth.currentUser?.uid || 'guest-editor-local',
        updatedAt: new Date().toISOString(),
      };
      const next = { ...prev, [project.id]: nextItem };
      persistItemsLocally(next);
      return next;
    });
  };

  const deleteProject = (id: string) => {
    setProjectsList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistSectionLocally('projects', updated);
      remove(ref(rtdb, `portfolio/projects/${id}`)).catch((e) => {
        console.warn('Project removal from RTDB notice:', e.message);
      });
      return updated;
    });
    setCustomItems((prev) => {
      const next = { ...prev };
      delete next[id];
      persistItemsLocally(next);
      return next;
    });
  };

  // REELS UPDATERS (Supports cloud Base64 videos in Firebase RTDB and cloud chunks)
  const updateReel = (id: string, patch: Partial<ReelItem>) => {
    // If videoUrl is a base64 string, upload to Firebase Realtime Database cloud
    if (patch.videoUrl && (patch.videoUrl.startsWith('data:video/') || (patch.videoUrl.length > 500 && !patch.videoUrl.startsWith('http')))) {
      uploadReelVideoToFirebase(id, patch.videoUrl).catch((e) => {
        console.warn('Reel cloud video upload notice:', e);
      });
    }

    setReelsList((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      persistSectionLocally('reels', updated);
      const targetReel = updated.find((r) => r.id === id);
      if (targetReel) {
        const safePayload = sanitizeReelForRtdb(targetReel);
        set(ref(rtdb, `portfolio/reels/${id}`), safePayload).catch((e) => {
          console.warn('Reel update to RTDB notice:', e.message);
        });
      }
      return updated;
    });

    if (patch.videoUrl || patch.title || patch.client) {
      setCustomItems((prev) => {
        const existing = prev[id] || {
          id,
          itemType: 'reel',
          title: patch.title || '',
          videoUrl: patch.videoUrl || '',
          updatedBy: auth.currentUser?.uid || 'guest-editor-local',
        };
        const nextItem: FirestorePortfolioItem = {
          ...existing,
          title: patch.title ?? existing.title,
          videoUrl: patch.videoUrl ?? existing.videoUrl,
          client: patch.client ?? existing.client,
          aspectRatio: patch.aspect ?? existing.aspectRatio,
          isBase64: patch.isBase64 ?? existing.isBase64,
        };
        const next = { ...prev, [id]: nextItem };
        persistItemsLocally(next);
        return next;
      });
    }
  };

  const addReel = (reel: ReelItem) => {
    // If videoUrl is a base64 string, upload to Firebase Realtime Database cloud
    if (reel.videoUrl && (reel.videoUrl.startsWith('data:video/') || (reel.videoUrl.length > 500 && !reel.videoUrl.startsWith('http')))) {
      uploadReelVideoToFirebase(reel.id, reel.videoUrl).catch((e) => {
        console.warn('Reel cloud video upload notice:', e);
      });
    }

    setReelsList((prev) => {
      const updated = [reel, ...prev];
      persistSectionLocally('reels', updated);
      
      const safePayload = sanitizeReelForRtdb(reel);
      set(ref(rtdb, `portfolio/reels/${reel.id}`), safePayload).catch((e) => {
        console.warn('Reel sync to RTDB notice:', e.message);
      });

      return updated;
    });

    setCustomItems((prev) => {
      const nextItem: FirestorePortfolioItem = {
        id: reel.id,
        itemType: 'reel',
        title: reel.title,
        videoUrl: reel.videoUrl.length > 500 ? (reel.fileName || 'cloud-video') : reel.videoUrl,
        client: reel.client,
        aspectRatio: reel.aspect,
        isBase64: reel.isBase64,
        updatedBy: auth.currentUser?.uid || 'guest-editor-local',
        updatedAt: new Date().toISOString(),
      };
      const next = { ...prev, [reel.id]: nextItem };
      persistItemsLocally(next);
      return next;
    });
  };

  const deleteReel = (id: string) => {
    // Clean up local IndexedDB storage and Firebase Cloud chunks
    removeStoredVideo(id).catch(() => {});
    remove(ref(rtdb, `portfolio/reelVideos/${id}`)).catch(() => {});

    setReelsList((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistSectionLocally('reels', updated);
      remove(ref(rtdb, `portfolio/reels/${id}`)).catch((e) => {
        console.warn('Reel removal from RTDB notice:', e.message);
      });
      return updated;
    });

    setCustomItems((prev) => {
      const next = { ...prev };
      delete next[id];
      persistItemsLocally(next);
      return next;
    });
  };

  const updateSkill = (index: number, patch: Partial<SkillItem>) => {
    setSkillsList((prev) => {
      const updated = prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
      persistSectionLocally('skills', updated);
      set(ref(rtdb, 'portfolio/skills'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Skills update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const addSkill = (skill: SkillItem) => {
    setSkillsList((prev) => {
      const updated = [...prev, skill];
      persistSectionLocally('skills', updated);
      set(ref(rtdb, 'portfolio/skills'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Skills addition to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const deleteSkill = (index: number) => {
    setSkillsList((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      persistSectionLocally('skills', updated);
      set(ref(rtdb, 'portfolio/skills'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Skills removal from RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateSoftwareTool = (index: number, patch: Partial<SoftwareTool>) => {
    setSoftwareList((prev) => {
      const updated = prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
      persistSectionLocally('software', updated);
      set(ref(rtdb, 'portfolio/software'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Software update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateTimelineStage = (index: number, patch: Partial<TimelineStage>) => {
    setTimelineList((prev) => {
      const updated = prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
      persistSectionLocally('timeline', updated);
      set(ref(rtdb, 'portfolio/timeline'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Timeline update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  const updateProcessStep = (index: number, patch: Partial<ProcessStep>) => {
    setProcessList((prev) => {
      const updated = prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s));
      persistSectionLocally('process', updated);
      set(ref(rtdb, 'portfolio/process'), cleanForFirebase(updated)).catch((e) => {
        console.warn('Process update to RTDB notice:', e.message);
      });
      return updated;
    });
  };

  // Google sign in / out
  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Save single item to Realtime Database
  const savePortfolioItem = async (item: {
    id: string;
    itemType: 'showreel' | 'project';
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    client?: string;
    role?: string;
    aspectRatio?: string;
    tagline?: string;
  }): Promise<SaveResult> => {
    setIsSyncing(true);
    const effectiveUserId = auth.currentUser?.email || auth.currentUser?.uid || 'guest-editor-local';

    const localPayload: FirestorePortfolioItem = {
      id: item.id,
      itemType: item.itemType,
      title: item.title.trim().slice(0, 120),
      videoUrl: item.videoUrl.trim(),
      updatedBy: effectiveUserId,
      updatedAt: new Date().toISOString(),
    };

    if (item.thumbnailUrl?.trim()) localPayload.thumbnailUrl = item.thumbnailUrl.trim();
    if (item.client?.trim()) localPayload.client = item.client.trim().slice(0, 100);
    if (item.role?.trim()) localPayload.role = item.role.trim().slice(0, 100);
    if (item.aspectRatio?.trim()) localPayload.aspectRatio = item.aspectRatio.trim().slice(0, 50);
    if (item.tagline?.trim()) localPayload.tagline = item.tagline.trim().slice(0, 500);

    // Save locally
    setCustomItems((prev) => {
      const next = { ...prev, [item.id]: localPayload };
      persistItemsLocally(next);
      return next;
    });

    if (item.id === 'showreel') {
      updateHeroContent({ videoUrl: item.videoUrl, posterUrl: item.thumbnailUrl || heroContent.posterUrl });
    }

    try {
      await set(ref(rtdb, `portfolio/customItems/${item.id}`), cleanForFirebase(localPayload));
      setIsSyncing(false);
      return {
        syncedToCloud: true,
        message: 'Saved to Firebase Realtime Database and synced across devices!',
      };
    } catch (error) {
      console.warn('Realtime Database write notice:', error);
      setIsSyncing(false);
      return {
        syncedToCloud: false,
        message: 'Saved locally in browser cutting suite.',
      };
    }
  };

  const resetPortfolioItem = async (id: string) => {
    setIsSyncing(true);
    setCustomItems((prev) => {
      const next = { ...prev };
      delete next[id];
      persistItemsLocally(next);
      return next;
    });

    try {
      await remove(ref(rtdb, `portfolio/customItems/${id}`));
    } catch (error) {
      console.warn('Failed to delete item from RTDB:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save all settings to Firebase Realtime Database
  const saveAllSettings = async (): Promise<SaveResult> => {
    setIsSyncing(true);

    // Always persist to localStorage
    persistSectionLocally('hero', heroContent);
    persistSectionLocally('about', aboutContent);
    persistSectionLocally('contact', contactContent);
    persistSectionLocally('projects', projectsList);
    persistSectionLocally('reels', reelsList);
    persistSectionLocally('skills', skillsList);
    persistSectionLocally('software', softwareList);
    persistSectionLocally('timeline', timelineList);
    persistSectionLocally('process', processList);

    try {
      const uid = auth.currentUser?.email || auth.currentUser?.uid || 'guest-editor-local';

      // Transform arrays into key-indexed objects for Realtime Database
      const projectsMap: Record<string, unknown> = {};
      projectsList.forEach((p) => {
        projectsMap[p.id] = cleanForFirebase(p);
      });

      const reelsMap: Record<string, unknown> = {};
      reelsList.forEach((r) => {
        reelsMap[r.id] = sanitizeReelForRtdb(r);
      });

      const fullPayload = {
        hero: heroContent,
        about: aboutContent,
        contact: contactContent,
        projects: projectsMap,
        reels: reelsMap,
        skills: skillsList,
        software: softwareList,
        timeline: timelineList,
        process: processList,
        customItems: customItems,
        lastUpdated: new Date().toISOString(),
        updatedBy: uid,
      };

      await set(ref(rtdb, 'portfolio'), cleanForFirebase(fullPayload));
      setIsSyncing(false);
      setRtdbConnected(true);

      return {
        syncedToCloud: true,
        message: 'All content, photos, and reel videos successfully saved to Firebase Realtime Database!',
      };
    } catch (error) {
      console.warn('RTDB write notice:', error);
      setIsSyncing(false);
      return {
        syncedToCloud: false,
        message: 'Saved locally in browser cutting suite! (Check Realtime Database write rules for cloud sync).',
      };
    }
  };

  // Reset section
  const resetSectionToDefault = (sectionKey: 'hero' | 'about' | 'contact' | 'projects' | 'skills' | 'software' | 'timeline' | 'process') => {
    switch (sectionKey) {
      case 'hero':
        setHeroContent(INITIAL_HERO_CONTENT);
        persistSectionLocally('hero', INITIAL_HERO_CONTENT);
        set(ref(rtdb, 'portfolio/hero'), INITIAL_HERO_CONTENT).catch(() => {});
        break;
      case 'about':
        setAboutContent(INITIAL_ABOUT_CONTENT);
        persistSectionLocally('about', INITIAL_ABOUT_CONTENT);
        set(ref(rtdb, 'portfolio/about'), INITIAL_ABOUT_CONTENT).catch(() => {});
        break;
      case 'contact':
        setContactContent(INITIAL_CONTACT_CONTENT);
        persistSectionLocally('contact', INITIAL_CONTACT_CONTENT);
        set(ref(rtdb, 'portfolio/contact'), INITIAL_CONTACT_CONTENT).catch(() => {});
        break;
      case 'projects':
        setProjectsList(DEFAULT_PROJECTS);
        persistSectionLocally('projects', DEFAULT_PROJECTS);
        break;
      case 'skills':
        setSkillsList(DEFAULT_SKILLS);
        persistSectionLocally('skills', DEFAULT_SKILLS);
        set(ref(rtdb, 'portfolio/skills'), DEFAULT_SKILLS).catch(() => {});
        break;
      case 'software':
        setSoftwareList(DEFAULT_SOFTWARE);
        persistSectionLocally('software', DEFAULT_SOFTWARE);
        set(ref(rtdb, 'portfolio/software'), DEFAULT_SOFTWARE).catch(() => {});
        break;
      case 'timeline':
        setTimelineList(DEFAULT_TIMELINE);
        persistSectionLocally('timeline', DEFAULT_TIMELINE);
        set(ref(rtdb, 'portfolio/timeline'), DEFAULT_TIMELINE).catch(() => {});
        break;
      case 'process':
        setProcessList(DEFAULT_PROCESS);
        persistSectionLocally('process', DEFAULT_PROCESS);
        set(ref(rtdb, 'portfolio/process'), DEFAULT_PROCESS).catch(() => {});
        break;
    }
  };

  // Reset everything
  const resetAllToDefaults = () => {
    setHeroContent(INITIAL_HERO_CONTENT);
    setAboutContent(INITIAL_ABOUT_CONTENT);
    setContactContent(INITIAL_CONTACT_CONTENT);
    setProjectsList(DEFAULT_PROJECTS);
    setReelsList(DEFAULT_REELS);
    setSkillsList(DEFAULT_SKILLS);
    setSoftwareList(DEFAULT_SOFTWARE);
    setTimelineList(DEFAULT_TIMELINE);
    setProcessList(DEFAULT_PROCESS);
    setCustomItems({});

    localStorage.removeItem(STORAGE_CACHE_KEY_ITEMS);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_hero`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_about`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_contact`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_projects`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_reels`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_skills`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_software`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_timeline`);
    localStorage.removeItem(`${STORAGE_CACHE_KEY_SECTIONS}_process`);
  };

  // Export JSON backup
  const exportSettingsJson = () => {
    const backup = {
      version: '4.0-rtdb',
      database: 'firebase-realtime-database',
      databaseURL: rtdbUrl,
      exportedAt: new Date().toISOString(),
      hero: heroContent,
      about: aboutContent,
      contact: contactContent,
      projects: projectsList,
      reels: reelsList,
      skills: skillsList,
      software: softwareList,
      timeline: timelineList,
      process: processList,
    };
    return JSON.stringify(backup, null, 2);
  };

  // Import JSON backup
  const importSettingsJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.hero) {
        setHeroContent(data.hero);
        persistSectionLocally('hero', data.hero);
      }
      if (data.about) {
        setAboutContent(data.about);
        persistSectionLocally('about', data.about);
      }
      if (data.contact) {
        setContactContent(data.contact);
        persistSectionLocally('contact', data.contact);
      }
      if (Array.isArray(data.projects)) {
        setProjectsList(data.projects);
        persistSectionLocally('projects', data.projects);
      }
      if (Array.isArray(data.reels)) {
        setReelsList(data.reels);
        persistSectionLocally('reels', data.reels);
      }
      if (Array.isArray(data.skills)) {
        setSkillsList(data.skills);
        persistSectionLocally('skills', data.skills);
      }
      if (Array.isArray(data.software)) {
        setSoftwareList(data.software);
        persistSectionLocally('software', data.software);
      }
      if (Array.isArray(data.timeline)) {
        setTimelineList(data.timeline);
        persistSectionLocally('timeline', data.timeline);
      }
      if (Array.isArray(data.process)) {
        setProcessList(data.process);
        persistSectionLocally('process', data.process);
      }
      return { success: true, message: 'Settings successfully restored from backup!' };
    } catch (e) {
      return { success: false, message: 'Invalid JSON format. Please check the backup file.' };
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        currentUser,
        authLoading,
        loginWithGoogle,
        logout,
        rtdbConnected,
        rtdbUrl,
        heroContent,
        updateHeroContent,
        aboutContent,
        updateAboutContent,
        contactContent,
        updateContactContent,
        projects: effectiveProjects,
        updateProject,
        addProject,
        deleteProject,
        reels: effectiveReels,
        updateReel,
        addReel,
        deleteReel,
        skills: skillsList,
        updateSkill,
        addSkill,
        deleteSkill,
        softwareTools: softwareList,
        updateSoftwareTool,
        timelineStages: timelineList,
        updateTimelineStage,
        processSteps: processList,
        updateProcessStep,
        showreelUrl,
        showreelData,
        customItems,
        isSyncing,
        savePortfolioItem,
        resetPortfolioItem,
        saveAllSettings,
        resetSectionToDefault,
        resetAllToDefaults,
        exportSettingsJson,
        importSettingsJson,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
