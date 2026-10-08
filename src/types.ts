export interface ProjectCaseStudy {
  creativeDirection: string;
  editingProcess: string;
  motionDesign: string;
  colorGrading: {
    logImage: string;
    rec709Image: string;
    lutName: string;
    notes: string;
  };
  soundDesign: {
    stems: {
      name: string;
      type: 'dialogue' | 'foley' | 'score' | 'ambience';
      gain: string;
    }[];
    notes: string;
  };
  finalCutSpecs: {
    resolution: string;
    fps: string;
    codec: string;
    runtime: string;
    aspectRatio: string;
  };
}

export interface Project {
  id: string;
  number: string;
  title: string;
  client: string;
  year: string;
  category: string;
  role: string;
  duration: string;
  aspect: string;
  videoUrl: string;
  posterUrl: string;
  tagline: string;
  tools: string[];
  caseStudy: ProjectCaseStudy;
}

export interface ReelItem {
  id: string;
  number: string;
  title: string;
  videoUrl: string; // Base64 data URI (data:video/mp4;base64,...) or remote direct stream
  aspect: string;
  client?: string;
  duration?: string;
  posterUrl?: string;
  base64Video?: string;
  isBase64?: boolean;
  hasStoredBlob?: boolean;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
}

export interface TimelineStage {
  id: string;
  name: string;
  order: string;
  title: string;
  description: string;
  workflowTip: string;
  nleClips: {
    track: 'V3' | 'V2' | 'V1' | 'A1' | 'A2' | 'A3';
    label: string;
    color: string;
    start: number; // percentage
    width: number; // percentage
  }[];
}

export interface SkillItem {
  name: string;
  category: string;
  description: string;
  cadence: string;
}

export interface SoftwareTool {
  name: string;
  role: string;
  experience: string;
  primaryShortcut: string;
  shortcutDescription: string;
  color: string;
  iconName: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  phase: string;
  duration: string;
  summary: string;
  deliverables: string[];
}
