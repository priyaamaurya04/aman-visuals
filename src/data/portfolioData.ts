import { Project, TimelineStage, SkillItem, SoftwareTool, ProcessStep } from '../types';

export const HERO_SHOWREEL_URL = '';
export const HERO_SHOWREEL_POSTER = '';

export const PROJECTS: Project[] = [];

export const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: 'footage',
    name: 'FOOTAGE',
    order: '01',
    title: 'INGESTION & ASSEMBLY',
    description: 'Transforming chaotic raw camera cards into an organized, proxy-synced sanctuary. Logging metadata, syncing dual-system audio, and building string-outs.',
    workflowTip: 'Organized by Scene / Shot / Take with color tags for director circle-takes. 0.5s reaction pauses preserved.',
    nleClips: [
      { track: 'V1', label: 'RAW_BROLL_CARD_A01', color: '#3b82f6', start: 5, width: 28 },
      { track: 'V1', label: 'RAW_CAM_A02_INTERVIEW', color: '#3b82f6', start: 35, width: 35 },
      { track: 'V1', label: 'RAW_DRONE_CARD_C', color: '#3b82f6', start: 72, width: 23 },
      { track: 'A1', label: 'DUAL_SYS_AUDIO_LAV', color: '#10b981', start: 35, width: 35 }
    ]
  },
  {
    id: 'cut',
    name: 'CUT',
    order: '02',
    title: 'THE ROUGH & FINE CUT',
    description: 'Carving the narrative spine. Selecting the exact frames that spark emotional resonance. Eliminating dead air while honoring dramatic pauses.',
    workflowTip: 'Every cut must justify its existence. J-cuts and L-cuts mask visual transitions with auditory flow.',
    nleClips: [
      { track: 'V1', label: 'SELECT_HERO_TAKE_04', color: '#f59e0b', start: 5, width: 18 },
      { track: 'V1', label: 'CLOSEUP_PUPIL_MATCH', color: '#f59e0b', start: 25, width: 14 },
      { track: 'V1', label: 'WIDE_ESTABLISHING_ROOF', color: '#f59e0b', start: 41, width: 22 },
      { track: 'V1', label: 'REACTION_OVER_SHOULDER', color: '#f59e0b', start: 65, width: 28 },
      { track: 'A1', label: 'CLEAN_DIALOGUE_EDITED', color: '#10b981', start: 5, width: 88 }
    ]
  },
  {
    id: 'transition',
    name: 'TRANSITION',
    order: '03',
    title: 'SEAMLESS FLOW & RHYTHM',
    description: 'Whip pans, match cuts, invisible wipes, and optical momentum. Creating a visual language where one frame effortlessly bleeds into the next.',
    workflowTip: 'Utilizing motion blur vector tracking to make hard cuts feel organically continuous.',
    nleClips: [
      { track: 'V2', label: 'WHIP_PAN_SPEED_RAMP', color: '#ec4899', start: 22, width: 7 },
      { track: 'V2', label: 'LUMA_FADE_DISSOLVE', color: '#ec4899', start: 62, width: 6 },
      { track: 'V1', label: 'A_ROLL_MASTER', color: '#f59e0b', start: 5, width: 90 },
      { track: 'A1', label: 'AUDIO_SWEEP_RISER', color: '#8b5cf6', start: 20, width: 10 }
    ]
  },
  {
    id: 'motion',
    name: 'MOTION',
    order: '04',
    title: 'GRAPHICS & KINETIC VFX',
    description: 'Layering kinetic typography, HUD overlays, screen replacements, 3D tracking, and composited camera projections.',
    workflowTip: 'Motion design must serve story—never distract from the human performance on screen.',
    nleClips: [
      { track: 'V3', label: '3D_KINETIC_TITLE_COMP', color: '#06b6d4', start: 10, width: 20 },
      { track: 'V3', label: 'TELEMETRY_HUD_TRACK', color: '#06b6d4', start: 45, width: 25 },
      { track: 'V2', label: 'VFX_LENS_FLARE_OPTICAL', color: '#ec4899', start: 25, width: 45 },
      { track: 'V1', label: 'STABILIZED_BASE_CUT', color: '#f59e0b', start: 5, width: 90 }
    ]
  },
  {
    id: 'color',
    name: 'COLOR',
    order: '05',
    title: 'COLOR GRADING & MOOD',
    description: 'Translating flat camera logs into rich cinematic poetry. Shot matching, skin tone preservation, custom film-stock emulation, and print LUTs.',
    workflowTip: 'Graded in ACEScc wide gamut color space to preserve highlight roll-off and shadow latitude.',
    nleClips: [
      { track: 'V3', label: 'ADJUSTMENT_KODAK_2383', color: '#e11d48', start: 5, width: 90 },
      { track: 'V2', label: 'POWER_WINDOW_SKIN_KEY', color: '#f97316', start: 20, width: 35 },
      { track: 'V1', label: 'COLOR_BALANCED_CLIPS', color: '#84cc16', start: 5, width: 90 }
    ]
  },
  {
    id: 'sound',
    name: 'SOUND',
    order: '06',
    title: 'SOUND DESIGN & FOLEY',
    description: 'Where 70% of cinema lives. Layering atmospheric room tone, crisp Foley, thunderous sub-bass, and emotional music stems.',
    workflowTip: 'Every movement on screen receives physical acoustic weight: shoe squeaks, cloth rustles, wind pressure.',
    nleClips: [
      { track: 'V1', label: 'LOCKED_PICTURE_CUT', color: '#64748b', start: 5, width: 90 },
      { track: 'A1', label: 'ISOLATED_DIALOGUE_VO', color: '#10b981', start: 5, width: 50 },
      { track: 'A2', label: 'FOLEY_STEPS_CLOTH_WHOOSH', color: '#a855f7', start: 10, width: 80 },
      { track: 'A3', label: 'ORCHESTRAL_SCORE_STEMS', color: '#38bdf8', start: 5, width: 90 }
    ]
  },
  {
    id: 'final',
    name: 'FINAL',
    order: '07',
    title: 'MASTER EXPORT & DELIVERY',
    description: 'Generating pristine DCI cinema packages, broadcast ProRes masters, and multi-ratio social deliveries with immaculate metadata.',
    workflowTip: 'QC checklist: Broadcast safe levels (-14 LUFS / 100 IRE limit), no dropped frames, color space tags verified.',
    nleClips: [
      { track: 'V3', label: 'FINAL_TITLES_CREDITS', color: '#ffffff', start: 80, width: 15 },
      { track: 'V2', label: 'MASTER_SUBTITLES_SRT', color: '#e2e8f0', start: 5, width: 90 },
      { track: 'V1', label: 'MASTER_DCI_4K_VIDEO', color: '#eab308', start: 5, width: 90 },
      { track: 'A1', label: '5.1_SURROUND_PRINT_MASTER', color: '#22c55e', start: 5, width: 90 }
    ]
  }
];

export const SKILLS: SkillItem[] = [
  {
    name: 'VIDEO EDITING',
    category: 'Core Narrative',
    description: 'Pacing, dramatic tension, invisible cutting, rhythm control, multi-cam assembly.',
    cadence: '24.00 fps / Frame-Accurate'
  },
  {
    name: 'MOTION GRAPHICS',
    category: 'Visual Design',
    description: 'Kinetic typography, logo animatics, UI HUD projections, 2D/3D composite overlays.',
    cadence: '60.00 fps / Interpolated'
  },
  {
    name: 'COLOR GRADING',
    category: 'Visual Chemistry',
    description: 'ACES & DaVinci YRGB Color Managed, custom film look LUTs, skin-tone isolation, HDR10.',
    cadence: 'Rec.709 / DCI-P3 / HDR'
  },
  {
    name: 'SOUND DESIGN',
    category: 'Acoustic Architecture',
    description: 'Foley layering, sub-bass synthesis, spatial panning, audio cleanup, loudness mastering.',
    cadence: '-14 LUFS / 48kHz 24-Bit'
  },
  {
    name: 'VISUAL STORYTELLING',
    category: 'Directorial Philosophy',
    description: 'Narrative structure, emotional resonance, non-linear timelines, documentary arc building.',
    cadence: 'Story-First Architecture'
  },
  {
    name: 'VFX',
    category: 'Digital Alchemy',
    description: 'Object removal, rotoscoping, camera tracking, sky replacements, green screen keying.',
    cadence: 'Optical Compositing'
  },
  {
    name: 'SHORT-FORM',
    category: 'High-Impact Digital',
    description: 'Retention-optimized hooks, vertical 9:16 re-framing, dynamic captions, viral pacing.',
    cadence: 'First 3 Seconds Hook'
  },
  {
    name: 'LONG-FORM',
    category: 'Documentary & Cinema',
    description: 'Multi-act narrative stamina, archival pacing, interview interweaving, feature rhythm.',
    cadence: 'Extended Narrative Arc'
  }
];

export const SOFTWARE_TOOLS: SoftwareTool[] = [
  {
    name: 'Premiere Pro',
    role: 'Primary NLE Cutting Engine',
    experience: '7+ Years Mastery',
    primaryShortcut: 'C / V / Q / W',
    shortcutDescription: 'Razor Tool, Selection, Ripple Trim to Playhead',
    color: '#9999ff',
    iconName: 'Film'
  },
  {
    name: 'After Effects',
    role: 'Kinetic Motion & Visual FX',
    experience: '6+ Years Mastery',
    primaryShortcut: 'U / P / S / R / F9',
    shortcutDescription: 'Reveal Keyframes, Transform, Easy-Ease Smooth Curves',
    color: '#d699ff',
    iconName: 'Sparkles'
  },
  {
    name: 'DaVinci Resolve',
    role: 'Color Science & Studio Grading',
    experience: '5+ Years Mastery',
    primaryShortcut: 'Alt+S / Alt+P',
    shortcutDescription: 'Add Serial Node, Add Parallel Node Graph',
    color: '#ff9966',
    iconName: 'Palette'
  },
  {
    name: 'Photoshop',
    role: 'Texture Assets & Poster Keyframes',
    experience: '7+ Years Mastery',
    primaryShortcut: 'M / L / W / Ctrl+T',
    shortcutDescription: 'Marquee, Lasso, Wand, Free Transform Scale',
    color: '#66ccff',
    iconName: 'Image'
  },
  {
    name: 'Audition',
    role: 'Spectral Audio Surgery & SFX',
    experience: '5+ Years Mastery',
    primaryShortcut: 'Shift+P / Shift+B',
    shortcutDescription: 'Capture Noise Print, Spectral Paintbrush Repair',
    color: '#33ffbb',
    iconName: 'Volume2'
  },
  {
    name: 'Blender',
    role: '3D Camera Projection & Camera Motion',
    experience: '3+ Years Craft',
    primaryShortcut: 'G / R / S / Shift+A',
    shortcutDescription: 'Grab Translate, Rotate 3D Axis, Scale, Add Mesh',
    color: '#ffaa33',
    iconName: 'Box'
  }
];

export const ABOUT_AMAN = {
  headline: 'THE EDITOR BEHIND THE FRAME.',
  subheadline: 'Shaping human emotion through cuts, silence, rhythm, and light.',
  biography: `I am Aman Gupta, a video editor, motion designer, and visual storyteller dedicated to the craft of editing. With over seven years behind professional cutting consoles, I view editing not merely as trimming clips, but as the final rewrite of the script.

My work spans commercial campaigns for international brands, high-energy automotive films, cinematic music videos, and award-winning festival short films. I obsess over the micro-rhythms: the fraction of a second a cut holds on a tear, the breathless acoustic silence before an impact, and the color tones that sub-consciously dictate how an audience feels.

Based between Mumbai and collaborating globally with directors, creative agencies, and forward-thinking creators.`,
  portraitUrl: '',
  stats: [
    { label: 'Commercials & Films', value: '120+', prefix: '', suffix: '+' },
    { label: 'Years of Craft', value: '7', prefix: '', suffix: '+ YRS' },
    { label: 'Global Views', value: '45', prefix: '', suffix: 'M+' },
    { label: 'Festival Selections', value: '14', prefix: '', suffix: ' LAURELS' }
  ],
  specializations: [
    'Rhythm & Match Cuts',
    'Psychological Tension',
    'ACES Color Grading',
    'Commercial Sound Design',
    'Kinetic Typography',
    'Long-form Retention'
  ],
  location: 'Mumbai, India • Available Worldwide (Remote & On-Set)'
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'DISCOVER',
    phase: 'The Vision & Script Dissection',
    duration: '1-2 Days',
    summary: 'Aligning with the director’s emotional intent, brand objectives, audience psychology, and musical mood boards.',
    deliverables: ['Pacing treatment', 'Reference showreel cuts', 'Audio cue scratch tracks']
  },
  {
    number: '02',
    title: 'PLAN',
    phase: 'Architecture & Ingestion',
    duration: '1-3 Days',
    summary: 'Organizing terabytes of raw camera cards into synchronized proxies, circle-takes, and comprehensive narrative stringouts.',
    deliverables: ['Dual-system audio sync', 'Metadata tagging', 'Assembly timeline framework']
  },
  {
    number: '03',
    title: 'EDIT',
    phase: 'The Rough & Fine Cut',
    duration: '3-7 Days',
    summary: 'The heart of the craft. Sculpting the emotional arc, locking rhythm, executing match-cuts, and iterating with collaborative timecode notes.',
    deliverables: ['Director’s Rough Cut', 'Fine Picture Lock (V1 to V3)', 'Collaborative review links']
  },
  {
    number: '04',
    title: 'POLISH',
    phase: 'Color, Sound & Motion',
    duration: '2-4 Days',
    summary: 'Elevating the picture locked edit through cinema color grading, multi-stem sound design, and bespoke motion typography.',
    deliverables: ['ACES color grade master', '5.1 & stereo sound mix', 'Kinetic typography overlays']
  },
  {
    number: '05',
    title: 'DELIVER',
    phase: 'Master QC & Delivery',
    duration: '1 Day',
    summary: 'Exporting pristine uncompressed broadcast masters, DCI cinema packages, and multi-aspect ratio social derivatives.',
    deliverables: ['ProRes 4444 Master', 'Web-optimized 4K files', 'Vertical 9:16 & 4:5 social crops']
  }
];

export const SOCIAL_LINKS = [
  { name: 'Email', handle: 'aman.gupta.edits@gmail.com', url: 'mailto:aman.gupta.edits@gmail.com', icon: 'Mail' },
  { name: 'Instagram', handle: '@amangupta.edits', url: 'https://instagram.com', icon: 'Instagram' },
  { name: 'LinkedIn', handle: 'in/amangupta-editor', url: 'https://linkedin.com', icon: 'Linkedin' },
  { name: 'YouTube', handle: '@AmanGuptaStoryteller', url: 'https://youtube.com', icon: 'Youtube' }
];

export interface ReelItem {
  id: string;
  number: string;
  title: string;
  videoUrl: string;
  aspect: string;
  client?: string;
  duration?: string;
  posterUrl?: string;
}

export const REELS: ReelItem[] = [];
