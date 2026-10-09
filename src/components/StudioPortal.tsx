import React, { useState } from 'react';
import {
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  Film,
  User,
  Sliders,
  Sparkles,
  Layers,
  Clock,
  Mail,
  Download,
  FileCode,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Info,
  ChevronRight,
  LogOut,
  LogIn,
  Maximize2,
  Check,
  Smartphone,
  Upload,
  Database,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { parseVideoUrl, base64ToBlobUrl, isBase64Video, fileToBase64 } from '../utils/videoUtils';
import { storeVideoBlob } from '../utils/videoStorage';
import { convertFileToBase64, isBase64Image, normalizeImageSrc, getBase64Size } from '../utils/imageUtils';
import { ReelItem } from '../types';

interface StudioPortalProps {
  onExit: () => void;
}

type TabType =
  | 'hero'
  | 'projects'
  | 'reels'
  | 'about'
  | 'skills'
  | 'software'
  | 'timeline'
  | 'process'
  | 'contact'
  | 'video_hub'
  | 'backup';

// Curated Royalty-Free Cinematic Video Streams
const CURATED_VIDEOS: { name: string; format: string; category: string; url: string }[] = [];

export const StudioPortal: React.FC<StudioPortalProps> = ({ onExit }) => {
  const {
    currentUser,
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
    projects,
    updateProject,
    addProject,
    deleteProject,
    reels,
    updateReel,
    addReel,
    deleteReel,
    savePortfolioItem,
    skills,
    updateSkill,
    addSkill,
    deleteSkill,
    softwareTools,
    updateSoftwareTool,
    timelineStages,
    updateTimelineStage,
    processSteps,
    updateProcessStep,
    saveAllSettings,
    resetSectionToDefault,
    resetAllToDefaults,
    exportSettingsJson,
    importSettingsJson,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '01-brand-film');
  const [selectedReelId, setSelectedReelId] = useState<string>(reels[0]?.id || 'reel-01');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  // Video Link Quick Test tool
  const [testVideoUrl, setTestVideoUrl] = useState('');

  // Portrait Photo Base64 File Uploader states
  const portraitImageFileRef = React.useRef<HTMLInputElement>(null);
  const [isConvertingPortraitBase64, setIsConvertingPortraitBase64] = useState(false);
  const [portraitInputMode, setPortraitInputMode] = useState<'upload' | 'manual'>('upload');

  const handlePortraitImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file (JPG, PNG, WebP, GIF).', 'error');
      if (portraitImageFileRef.current) portraitImageFileRef.current.value = '';
      return;
    }

    try {
      setIsConvertingPortraitBase64(true);
      const base64Data = await convertFileToBase64(file, { maxWidth: 1200, maxHeight: 1500, quality: 0.88 });
      updateAboutContent({ portraitUrl: base64Data });
      const sizeStr = getBase64Size(base64Data);
      showNotification(`Portrait updated! Converted to Base64 data (${sizeStr}).`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error converting image';
      showNotification(`Base64 conversion failed: ${msg}`, 'error');
    } finally {
      setIsConvertingPortraitBase64(false);
      if (portraitImageFileRef.current) portraitImageFileRef.current.value = '';
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveAllSettings();
      showNotification(res.message, res.syncedToCloud ? 'success' : 'info');
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
    showNotification('Video URL copied to clipboard!', 'info');
  };

  // Helper to render video player cleanly with zero scrollbar
  const renderCleanVideoPreview = (videoUrl: string, title: string) => {
    if (!videoUrl || !videoUrl.trim()) {
      return (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <Film className="w-8 h-8 text-zinc-700 mb-2" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            No Video Stream Configured
          </span>
        </div>
      );
    }

    const parsed = parseVideoUrl(videoUrl);

    if (parsed.source === 'instagram' && parsed.embedUrl) {
      return (
        <div className="relative w-full max-w-[340px] aspect-[9/16] mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-black">
          <iframe
            src={parsed.embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            scrolling="no"
            className="border-0 pointer-events-none"
            style={{
              position: 'absolute',
              width: '100%',
              height: 'calc(100% + 155px)',
              top: '-52px',
              left: '0',
            }}
          />
        </div>
      );
    }

    if (parsed.type === 'embed' && parsed.embedUrl) {
      return (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black">
          <iframe
            src={parsed.embedUrl}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    const playableSrc = parsed.directUrl || base64ToBlobUrl(videoUrl);
    if (!playableSrc) return null;

    return (
      <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black">
        <video
          src={playableSrc}
          controls
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060609] text-zinc-100 flex flex-col relative z-10 pointer-events-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0c0c12]/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-bold font-mono text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-heading font-bold text-lg text-white tracking-wide uppercase">
                STUDIO CONTROL CENTER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase flex items-center space-x-1">
                <Database className="w-3 h-3 text-amber-400" />
                <span>RTDB</span>
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>REALTIME DATABASE CONNECTED</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400">
              Live sync via Firebase Realtime Database • aman-portfolio-f7222-default-rtdb
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Auth indicator */}
          {currentUser ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 truncate max-w-[140px]">{currentUser.email}</span>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="text-zinc-500 hover:text-red-400 ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>SIGN IN TO SYNC CLOUD</span>
            </button>
          )}

          {/* Save All Button */}
          <button
            onClick={handleGlobalSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-sans font-bold tracking-wider uppercase transition-all duration-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'SAVING...' : 'SAVE ALL CHANGES'}</span>
          </button>

          {/* Exit / Return to Portfolio */}
          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-sans font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>PREVIEW SITE</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`px-6 py-3 border-b text-xs font-mono flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-red-950/80 border-red-500/50 text-red-300'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-amber-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace with Sidebar Tabs */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#09090e] border-r border-zinc-800/80 p-4 shrink-0">
          <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase px-3 py-2">
            SECTIONS & STREAMS
          </div>
          <nav className="space-y-1">
            {[
              { id: 'hero', label: 'Hero & Identity', icon: Film },
              { id: 'projects', label: 'Selected Work (Films)', icon: Play },
              { id: 'reels', label: 'Vertical Reels (9:16)', icon: Smartphone },
              { id: 'about', label: 'About & Biography', icon: User },
              { id: 'skills', label: 'Services & Disciplines', icon: Sparkles },
              { id: 'software', label: 'Software Arsenal', icon: Layers },
              { id: 'timeline', label: 'Editing Timeline', icon: Clock },
              { id: 'process', label: '5-Phase Process', icon: ChevronRight },
              { id: 'contact', label: 'Contact & Socials', icon: Mail },
              { id: 'video_hub', label: 'Video Presets & Streams', icon: Film },
              { id: 'backup', label: 'Cloud & Backup', icon: FileCode },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-sans font-medium transition-all ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Info Card */}
          <div className="mt-8 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-[11px] font-mono text-zinc-400 space-y-2">
            <div className="flex items-center space-x-1 text-amber-400 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>DIRECT VIDEO WORKFLOW</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              Paste direct MP4, YouTube, Vimeo, or Instagram Reel links. Video frames render automatically with zero thumbnail hassle.
            </p>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl overflow-y-auto relative z-10 pointer-events-auto">
          {/* ================= HERO TAB ================= */}
          {activeTab === 'hero' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    HERO & SHOWREEL STREAM
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Configure the main showreel video URL, editor identity name, headline quote, and action buttons.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('hero');
                    showNotification('Hero section restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              {/* Live Preview of Hero Video */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0f] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Play className="w-3.5 h-3.5" />
                    <span>HERO VIDEO STREAM PREVIEW</span>
                  </span>
                  <span className="uppercase text-zinc-500">
                    {parseVideoUrl(heroContent.videoUrl).source} STREAM
                  </span>
                </div>

                {renderCleanVideoPreview(heroContent.videoUrl, 'Hero Video Preview')}
              </div>

              {/* Form Fields (No Thumbnail Photo Clutter) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editor Name */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Editor / Director Display Name
                  </label>
                  <input
                    type="text"
                    value={heroContent.name ?? ''}
                    onChange={(e) => updateHeroContent({ name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    placeholder="AMAN GUPTA"
                  />
                  <p className="text-[11px] font-mono text-zinc-500">
                    Splits into high-contrast stylized hero titles (First & Last name).
                  </p>
                </div>

                {/* Profession Eyebrow */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Profession Eyebrow Badge
                  </label>
                  <input
                    type="text"
                    value={heroContent.badge ?? ''}
                    onChange={(e) => updateHeroContent({ badge: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    placeholder="VIDEO EDITOR / MOTION DESIGNER"
                  />
                </div>

                {/* Hero Headline Statement */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Hero Headline Quote
                  </label>
                  <input
                    type="text"
                    value={heroContent.headline ?? ''}
                    onChange={(e) => updateHeroContent({ headline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    placeholder="I EDIT STORIES THAT DESERVE TO BE REMEMBERED."
                  />
                </div>

                {/* Video URL (Supports MP4, YouTube, Vimeo, Instagram Reel) */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Showreel Background Video URL
                  </label>
                  <input
                    type="text"
                    value={heroContent.videoUrl ?? ''}
                    onChange={(e) => updateHeroContent({ videoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none font-mono"
                    placeholder="https://... Google Drive, direct .mp4, YouTube, Vimeo, Instagram Reel"
                  />
                  <p className="text-[11px] font-mono text-zinc-500">
                    Supports Google Drive (set to &quot;Anyone with the link&quot;), direct MP4, YouTube, Vimeo, and Instagram Reel URLs.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={heroContent.ctaReelText ?? ''}
                    onChange={(e) => updateHeroContent({ ctaReelText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={heroContent.ctaWorkText ?? ''}
                    onChange={(e) => updateHeroContent({ ctaWorkText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= PROJECTS TAB ================= */}
          {activeTab === 'projects' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    PORTFOLIO WORK & CASE STUDIES
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Edit project video streams, clients, aspect ratios, and in-depth case study notes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('projects');
                    showNotification('Projects restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET PROJECTS</span>
                </button>
              </div>

                  {/* Project Selector Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                {projects.map((proj) => {
                  const isCurrent = proj.id === selectedProject?.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                        isCurrent
                          ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {proj.number} • {proj.title}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const nextNum = String(projects.length + 1).padStart(2, '0');
                    const newId = `project-${Date.now()}`;
                    addProject({
                      id: newId,
                      number: nextNum,
                      title: `NEW PROJECT ${nextNum}`,
                      client: 'Featured Client',
                      year: '2025',
                      category: 'COMMERCIAL FILM',
                      role: 'Lead Video Editor',
                      duration: '01:30',
                      aspect: '16:9 Cinema',
                      videoUrl: '',
                      posterUrl: '',
                      tagline: 'Narrative commercial edit with precision pacing.',
                      tools: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
                      caseStudy: {
                        creativeDirection: 'Focused on high-impact visual storytelling and rhythmic pacing.',
                        editingProcess: 'Frame-accurate assembly, speed-ramping, and J/L audio cuts.',
                        motionDesign: 'Clean kinetic typography and composited optical transitions.',
                        colorGrading: {
                          logImage: '',
                          rec709Image: '',
                          lutName: 'ACEScc Cinema Print',
                          notes: 'Balanced skin tones and rich contrast.',
                        },
                        soundDesign: {
                          stems: [
                            { name: 'Dialogue / VO', type: 'dialogue', gain: '0.0 dB' },
                            { name: 'Music Score', type: 'score', gain: '-3.0 dB' },
                            { name: 'Foley & SFX', type: 'foley', gain: '-2.0 dB' },
                          ],
                          notes: 'Mastered at -14 LUFS broadcast standard.',
                        },
                        finalCutSpecs: {
                          resolution: '3840 × 2160 (4K UHD)',
                          fps: '23.976 fps',
                          codec: 'ProRes 422 HQ',
                          runtime: '01:30:00',
                          aspectRatio: '16:9',
                        },
                      },
                    });
                    setSelectedProjectId(newId);
                    showNotification('New project added! Paste your video URL below.', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap bg-zinc-900 border border-dashed border-amber-400/50 text-amber-400 hover:bg-amber-400 hover:text-zinc-950 transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD PROJECT</span>
                </button>
              </div>

              {selectedProject && (
                <div className="space-y-6">
                  {/* Clean Live Video Preview (Zero Scrollbar, Responsive) */}
                  <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0f] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="text-amber-400 font-bold">
                        {selectedProject.number} • {selectedProject.title} ({selectedProject.aspect})
                      </span>
                      <span>{selectedProject.client}</span>
                    </div>

                    {renderCleanVideoPreview(selectedProject.videoUrl, selectedProject.title)}
                  </div>

                  {/* Project Fields (No Thumbnail Photo Input) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={selectedProject.title ?? ''}
                        onChange={(e) => updateProject(selectedProject.id, { title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Client / Brand Name
                      </label>
                      <input
                        type="text"
                        value={selectedProject.client ?? ''}
                        onChange={(e) => updateProject(selectedProject.id, { client: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {/* Video URL */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Video Stream URL (MP4, Google Drive, YouTube, Vimeo, Reel)
                      </label>
                      <input
                        type="text"
                        value={selectedProject.videoUrl ?? ''}
                        onChange={(e) => updateProject(selectedProject.id, { videoUrl: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none font-mono"
                        placeholder="https://... Google Drive, direct .mp4, YouTube, Vimeo, or Instagram Reel"
                      />
                      <p className="text-[11px] font-mono text-zinc-500">
                        Supports Google Drive (set to &quot;Anyone with the link&quot;), direct MP4, YouTube, Vimeo, and Instagram Reel URLs.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Aspect Ratio
                      </label>
                      <select
                        value={selectedProject.aspect ?? '16:9 Cinema'}
                        onChange={(e) => updateProject(selectedProject.id, { aspect: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                      >
                        <option value="16:9 Cinema">16:9 Cinema</option>
                        <option value="9:16 Vertical Reel">9:16 Vertical Reel</option>
                        <option value="2.39:1 Anamorphic">2.39:1 Anamorphic</option>
                        <option value="4:5 Social Master">4:5 Social Master</option>
                        <option value="1:1 Square">1:1 Square</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Category & Year
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={selectedProject.category ?? ''}
                          onChange={(e) => updateProject(selectedProject.id, { category: e.target.value })}
                          className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm"
                          placeholder="Automotive Commercial"
                        />
                        <input
                          type="text"
                          value={selectedProject.year ?? ''}
                          onChange={(e) => updateProject(selectedProject.id, { year: e.target.value })}
                          className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm"
                          placeholder="2025"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Tagline / Overview
                      </label>
                      <input
                        type="text"
                        value={selectedProject.tagline ?? ''}
                        onChange={(e) => updateProject(selectedProject.id, { tagline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {/* Case Study Creative Direction */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Case Study: Creative Direction
                      </label>
                      <textarea
                        rows={3}
                        value={selectedProject.caseStudy?.creativeDirection ?? ''}
                        onChange={(e) =>
                          updateProject(selectedProject.id, {
                            caseStudy: { ...(selectedProject.caseStudy || {}), creativeDirection: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm leading-relaxed"
                      />
                    </div>

                    {/* Case Study Editing Process */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                        Case Study: Editing Process
                      </label>
                      <textarea
                        rows={3}
                        value={selectedProject.caseStudy?.editingProcess ?? ''}
                        onChange={(e) =>
                          updateProject(selectedProject.id, {
                            caseStudy: { ...(selectedProject.caseStudy || {}), editingProcess: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= VERTICAL REELS TAB (9:16 CAROUSEL) ================= */}
          {activeTab === 'reels' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs tracking-wider uppercase mb-1">
                    <Smartphone className="w-4 h-4" />
                    <span>CAROUSEL REELS MANAGER</span>
                  </div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    VERTICAL REELS (9:16 SHOWCASE)
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Every video in the public/videos folder shows up here and in the home carousel automatically.
                  </p>
                </div>
              </div>

              {/* Active Carousel Reels Deck */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base uppercase tracking-wider text-white">
                    CURRENT CAROUSEL REELS ({reels.length})
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Auto-slides seamlessly every 2s
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="rounded-2xl border border-zinc-800 bg-[#09090f] p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
                    >
                      {/* 9:16 Preview Box */}
                      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                        <video
                          src={reel.videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur text-[10px] font-mono text-amber-400 border border-white/10 z-10 flex items-center space-x-1">
                          <span>#{reel.number}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="font-heading font-bold text-sm text-white uppercase block truncate">
                            {reel.title}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 block truncate">
                            public/videos/{reel.fileName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= ABOUT TAB ================= */}
          {activeTab === 'about' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    ABOUT & BIOGRAPHY
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Edit the editor biography, portrait photo, location, and key statistics.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('about');
                    showNotification('About section restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              {/* Portrait Preview and Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Portrait Preview with Drag & Drop */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 uppercase">DIRECTOR PORTRAIT</span>
                    {isBase64Image(aboutContent.portraitUrl) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3 text-emerald-400" />
                        BASE64
                      </span>
                    )}
                  </div>

                  <div
                    onClick={() => portraitImageFileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePortraitImageFile(file);
                    }}
                    className="rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-amber-400 bg-[#0c0c11] aspect-[4/5] relative group cursor-pointer transition-all shadow-xl"
                  >
                    {normalizeImageSrc(aboutContent.portraitUrl) ? (
                      <img
                        src={normalizeImageSrc(aboutContent.portraitUrl)}
                        alt="Portrait Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
                        <User className="w-10 h-10 text-zinc-700 mb-2" />
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          No Portrait Uploaded
                        </span>
                      </div>
                    )}

                    {/* Drag & Drop Overlay */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mb-2">
                        <Upload className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        {isConvertingPortraitBase64 ? 'CONVERTING TO BASE64...' : 'CLICK OR DROP NEW PHOTO'}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300/90 mt-1">
                        Encodes automatically into Base64
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/85 backdrop-blur-md p-2 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400 pointer-events-none">
                      {aboutContent.location}
                    </div>
                  </div>

                  {/* Hidden File Picker Input */}
                  <input
                    ref={portraitImageFileRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePortraitImageFile(file);
                    }}
                  />

                  {/* Quick Action Buttons under Portrait */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => portraitImageFileRef.current?.click()}
                      disabled={isConvertingPortraitBase64}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isConvertingPortraitBase64 ? 'ENCODING...' : 'UPLOAD BASE64'}</span>
                    </button>
                    {isBase64Image(aboutContent.portraitUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aboutContent.portraitUrl);
                          showNotification('Base64 string copied to clipboard!', 'info');
                        }}
                        title="Copy Base64 string"
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Form Controls */}
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={aboutContent.headline ?? ''}
                      onChange={(e) => updateAboutContent({ headline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                      Subheadline Quote
                    </label>
                    <input
                      type="text"
                      value={aboutContent.subheadline ?? ''}
                      onChange={(e) => updateAboutContent({ subheadline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* Portrait Photo (Base64 or URL) */}
                  <div className="space-y-3 p-4 rounded-xl border border-zinc-800 bg-[#0a0a0f]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <label className="text-xs font-mono text-zinc-200 uppercase tracking-wider font-bold">
                          PORTRAIT PHOTO (BASE64 & URL)
                        </label>
                      </div>

                      {/* Mode switch: Upload File vs Paste Base64/URL */}
                      <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setPortraitInputMode('upload')}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            portraitInputMode === 'upload'
                              ? 'bg-amber-400 text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          FILE UPLOADER
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortraitInputMode('manual')}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            portraitInputMode === 'manual'
                              ? 'bg-amber-400 text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          PASTE BASE64 / URL
                        </button>
                      </div>
                    </div>

                    {portraitInputMode === 'upload' ? (
                      /* Drag & Drop File Zone */
                      <div
                        onClick={() => portraitImageFileRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handlePortraitImageFile(file);
                        }}
                        className="border-2 border-dashed border-zinc-700 hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer bg-zinc-950/60 hover:bg-zinc-900/60 transition-all group"
                      >
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                        <p className="text-xs font-mono text-zinc-200 font-bold">
                          Drop image here or click to browse
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-1">
                          Converts PNG, JPG, or WebP automatically into Base64 format
                        </p>
                      </div>
                    ) : (
                      /* Manual Text Input for Base64 or URL */
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={aboutContent.portraitUrl ?? ''}
                          onChange={(e) => {
                            const normalized = normalizeImageSrc(e.target.value) || '';
                            updateAboutContent({ portraitUrl: normalized });
                          }}
                          placeholder="Paste data:image/jpeg;base64,... or raw Base64 or image URL"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                        />
                        <p className="text-[10px] font-mono text-zinc-500">
                          Tip: You can paste a full data URI (e.g. data:image/png;base64,...) or raw Base64 string directly here.
                        </p>
                      </div>
                    )}

                    {/* Status bar for current portrait photo */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center space-x-2 truncate">
                        {isBase64Image(aboutContent.portraitUrl) ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>BASE64 ({getBase64Size(aboutContent.portraitUrl)})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            EXTERNAL URL
                          </span>
                        )}
                        <span className="truncate max-w-[260px] text-zinc-500">
                          {aboutContent.portraitUrl.slice(0, 50)}...
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isBase64Image(aboutContent.portraitUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aboutContent.portraitUrl);
                              showNotification('Base64 copied to clipboard!', 'info');
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                          >
                            Copy Base64
                          </button>
                        )}
                        {aboutContent.portraitUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAboutContent({
                                portraitUrl: '',
                              });
                              showNotification('Portrait cleared.', 'info');
                            }}
                            className="text-zinc-500 hover:text-zinc-300 hover:underline cursor-pointer"
                          >
                            Clear Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                      Location & Availability
                    </label>
                    <input
                      type="text"
                      value={aboutContent.location ?? ''}
                      onChange={(e) => updateAboutContent({ location: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                      Full Biography Text
                    </label>
                    <textarea
                      rows={6}
                      value={aboutContent.biography ?? ''}
                      onChange={(e) => updateAboutContent({ biography: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm leading-relaxed focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* 2 Key Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">STAT 1</span>
                      <input
                        type="text"
                        value={aboutContent.stat1Value ?? ''}
                        onChange={(e) => updateAboutContent({ stat1Value: e.target.value })}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-amber-400 font-bold"
                      />
                      <input
                        type="text"
                        value={aboutContent.stat1Label ?? ''}
                        onChange={(e) => updateAboutContent({ stat1Label: e.target.value })}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300"
                      />
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">STAT 2</span>
                      <input
                        type="text"
                        value={aboutContent.stat2Value ?? ''}
                        onChange={(e) => updateAboutContent({ stat2Value: e.target.value })}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-amber-400 font-bold"
                      />
                      <input
                        type="text"
                        value={aboutContent.stat2Label ?? ''}
                        onChange={(e) => updateAboutContent({ stat2Label: e.target.value })}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SERVICES & SKILLS TAB ================= */}
          {activeTab === 'skills' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    SERVICES & DISCIPLINES
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Edit kinetic typography services, categories, descriptions, and pacing cadences.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('skills');
                    showNotification('Services restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              <div className="space-y-4">
                {skills.map((skill, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-zinc-800 bg-[#09090e] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">SERVICE #{idx + 1}</span>
                      <button
                        onClick={() => deleteSkill(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Service Name</label>
                        <input
                          type="text"
                          value={skill.name ?? ''}
                          onChange={(e) => updateSkill(idx, { name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Category</label>
                        <input
                          type="text"
                          value={skill.category ?? ''}
                          onChange={(e) => updateSkill(idx, { category: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Cadence / Metric</label>
                        <input
                          type="text"
                          value={skill.cadence ?? ''}
                          onChange={(e) => updateSkill(idx, { cadence: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Description</label>
                      <textarea
                        rows={2}
                        value={skill.description ?? ''}
                        onChange={(e) => updateSkill(idx, { description: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    addSkill({
                      name: 'NEW EDITING DISCIPLINE',
                      category: 'POST-PRODUCTION',
                      description: 'High-impact editorial craftsmanship.',
                      cadence: '24 FPS FRAME ACCURATE',
                    });
                    showNotification('New discipline added!', 'success');
                  }}
                  className="w-full py-3 rounded-xl border border-dashed border-zinc-700 hover:border-amber-400 text-zinc-400 hover:text-amber-400 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD NEW SERVICE ROW</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SOFTWARE ARSENAL TAB ================= */}
          {activeTab === 'software' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    SOFTWARE ARSENAL
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Configure NLE software tools, keyboard shortcuts, roles, and experience levels.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('software');
                    showNotification('Software arsenal restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {softwareTools.map((tool, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-zinc-800 bg-[#09090e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">{tool.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{tool.experience}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Primary Role</label>
                        <input
                          type="text"
                          value={tool.role ?? ''}
                          onChange={(e) => updateSoftwareTool(idx, { role: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Experience</label>
                        <input
                          type="text"
                          value={tool.experience ?? ''}
                          onChange={(e) => updateSoftwareTool(idx, { experience: e.target.value })}
                          placeholder="7+ Years Mastery"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Primary Shortcut</label>
                        <input
                          type="text"
                          value={tool.primaryShortcut ?? ''}
                          onChange={(e) => updateSoftwareTool(idx, { primaryShortcut: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-amber-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Shortcut Description</label>
                        <input
                          type="text"
                          value={tool.shortcutDescription ?? ''}
                          onChange={(e) => updateSoftwareTool(idx, { shortcutDescription: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= EDITING TIMELINE TAB ================= */}
          {activeTab === 'timeline' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    EDITING TIMELINE STAGES
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Customize the 7 NLE pipeline stages shown on the interactive timeline.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('timeline');
                    showNotification('Timeline stages restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              <div className="space-y-4">
                {timelineStages.map((stage, idx) => (
                  <div key={stage.id} className="p-5 rounded-xl border border-zinc-800 bg-[#09090e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        STAGE {stage.order} • {stage.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Stage Title</label>
                        <input
                          type="text"
                          value={stage.title ?? ''}
                          onChange={(e) => updateTimelineStage(idx, { title: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Workflow Tip</label>
                        <input
                          type="text"
                          value={stage.workflowTip ?? ''}
                          onChange={(e) => updateTimelineStage(idx, { workflowTip: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Description</label>
                      <textarea
                        rows={2}
                        value={stage.description ?? ''}
                        onChange={(e) => updateTimelineStage(idx, { description: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 5-PHASE PROCESS TAB ================= */}
          {activeTab === 'process' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    5-PHASE EDITORIAL PROCESS
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Configure the horizontal workflow cards from Ingest to Theatrical Master.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('process');
                    showNotification('Process steps restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              <div className="space-y-4">
                {processSteps.map((step, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-zinc-800 bg-[#09090e] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        PHASE {step.number} • {step.phase}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{step.duration}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Title</label>
                        <input
                          type="text"
                          value={step.title ?? ''}
                          onChange={(e) => updateProcessStep(idx, { title: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Duration</label>
                        <input
                          type="text"
                          value={step.duration ?? ''}
                          onChange={(e) => updateProcessStep(idx, { duration: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Summary</label>
                      <textarea
                        rows={2}
                        value={step.summary ?? ''}
                        onChange={(e) => updateProcessStep(idx, { summary: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= CONTACT & SOCIALS TAB ================= */}
          {activeTab === 'contact' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                    CONTACT & SOCIAL TRANSMISSIONS
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    Update direct inquiries email, phone, location, and social media handles.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSectionToDefault('contact');
                    showNotification('Contact info restored to factory defaults.', 'info');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET SECTION</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Contact Headline
                  </label>
                  <input
                    type="text"
                    value={contactContent.headline ?? ''}
                    onChange={(e) => updateContactContent({ headline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Commission Subheadline
                  </label>
                  <input
                    type="text"
                    value={contactContent.subheadline ?? ''}
                    onChange={(e) => updateContactContent({ subheadline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Inquiries Email Address
                  </label>
                  <input
                    type="email"
                    value={contactContent.email ?? ''}
                    onChange={(e) => updateContactContent({ email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Direct Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={contactContent.phone ?? ''}
                    onChange={(e) => updateContactContent({ phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    value={contactContent.instagram ?? ''}
                    onChange={(e) => updateContactContent({ instagram: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={contactContent.linkedin ?? ''}
                    onChange={(e) => updateContactContent({ linkedin: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    value={contactContent.youtube ?? ''}
                    onChange={(e) => updateContactContent({ youtube: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

              </div>
            </div>
          )}

          {/* ================= VIDEO PRESETS & STREAMS TAB ================= */}
          {activeTab === 'video_hub' && (
            <div className="space-y-10 animate-in fade-in duration-200">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                  VIDEO PRESETS & LIVE STREAM HUB
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  Select and test cinematic video streams. Apply with 1 click to your Hero Showreel or Portfolio Projects.
                </p>
              </div>

              {/* Quick Stream Test / Validator Bar */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0c0c14] space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <Play className="w-4 h-4" />
                  <span>TEST ANY VIDEO URL (INSTAGRAM, YOUTUBE, VIMEO, MP4)</span>
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={testVideoUrl ?? ''}
                    onChange={(e) => setTestVideoUrl(e.target.value)}
                    placeholder="Paste any Instagram Reel, YouTube, Vimeo, or direct .mp4 link to test live..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                  {testVideoUrl && (
                    <button
                      onClick={() => setTestVideoUrl('')}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-mono rounded-xl hover:bg-zinc-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {testVideoUrl && (
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="text-emerald-400 font-bold">STREAM DETECTED:</span>
                      <span>{parseVideoUrl(testVideoUrl).source.toUpperCase()}</span>
                    </div>
                    {renderCleanVideoPreview(testVideoUrl, 'Live Test Stream')}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => {
                          updateHeroContent({ videoUrl: testVideoUrl });
                          showNotification('Applied to Hero Background Showreel!', 'success');
                        }}
                        className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-xs font-sans rounded-xl hover:bg-amber-300 uppercase tracking-wider"
                      >
                        Set as Hero Showreel
                      </button>
                      {selectedProject && (
                        <button
                          onClick={() => {
                            updateProject(selectedProject.id, { videoUrl: testVideoUrl });
                            showNotification(`Applied to ${selectedProject.title}!`, 'success');
                          }}
                          className="px-4 py-2 bg-zinc-800 text-white font-bold text-xs font-sans rounded-xl hover:bg-zinc-700 uppercase tracking-wider border border-zinc-700"
                        >
                          Set for {selectedProject.number} ({selectedProject.title})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Curated Royalty-Free Video Streams */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                    CURATED VIDEO STREAMS
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">Direct MP4, YouTube, Vimeo, Reel</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CURATED_VIDEOS.map((vid, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-zinc-800 bg-[#09090e] space-y-3 hover:border-amber-400/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-sans font-bold text-white truncate">{vid.name}</span>
                          <span className="text-[10px] font-mono text-amber-400">{vid.format}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 truncate">{vid.url}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              updateHeroContent({ videoUrl: vid.url });
                              showNotification(`Applied ${vid.name} to Hero Showreel!`, 'success');
                            }}
                            className="flex-1 py-1.5 bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-xs font-mono text-zinc-200 rounded-lg transition-colors text-center"
                          >
                            Set Hero
                          </button>
                          {selectedProject && (
                            <button
                              onClick={() => {
                                updateProject(selectedProject.id, { videoUrl: vid.url });
                                showNotification(`Applied to ${selectedProject.title}!`, 'success');
                              }}
                              className="flex-1 py-1.5 bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-xs font-mono text-zinc-200 rounded-lg transition-colors text-center"
                            >
                              Set {selectedProject.number}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(vid.url)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg"
                            title="Copy Video URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= BACKUP & CLOUD SYNC TAB ================= */}
          {activeTab === 'backup' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-tight">
                  CLOUD SYNC & BACKUP RECOVERY
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  Export complete settings to JSON or restore existing backup payloads.
                </p>
              </div>

              {/* Cloud Status */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0a0f] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="font-heading font-bold text-base text-white uppercase">
                      CLOUD FIRESTORE STATUS
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    Database ID: <code className="text-amber-400">ai-studio-amanguptavideoed-...</code>
                  </span>
                </div>

                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  {currentUser
                    ? `Authenticated as ${currentUser.email}. All changes written here are synced instantly to production Firestore collections (/portfolio_items and /site_settings).`
                    : 'Currently running in high-performance local cutting room mode. To enable cross-device cloud persistence, sign in with your Google account above.'}
                </p>
              </div>

              {/* Backup / Export / Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-[#09090e] space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase">
                    <Download className="w-4 h-4" />
                    <span>EXPORT CONFIGURATION</span>
                  </div>
                  <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                    Download a complete JSON snapshot containing all your customized video URLs, headlines, biography, tools, and processes.
                  </p>
                  <button
                    onClick={() => {
                      const json = exportSettingsJson();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `aman_gupta_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      showNotification('Backup JSON exported successfully!', 'success');
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-sans font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Download JSON Backup
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-[#09090e] space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase">
                    <Download className="w-4 h-4" />
                    <span>IMPORT CONFIGURATION</span>
                  </div>
                  <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                    Paste a previously exported JSON backup to restore all site videos and texts in one action.
                  </p>
                  <button
                    onClick={() => setShowImportBox(!showImportBox)}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-sans font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    {showImportBox ? 'Hide Import Box' : 'Open Import Box'}
                  </button>
                </div>
              </div>

              {showImportBox && (
                <div className="p-6 rounded-2xl border border-amber-400/40 bg-[#0e0e15] space-y-3">
                  <label className="text-xs font-mono text-amber-400 font-bold block">
                    PASTE JSON BACKUP DATA:
                  </label>
                  <textarea
                    rows={6}
                    value={importJsonText ?? ''}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="Paste JSON configuration payload here..."
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 font-mono text-xs"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowImportBox(false)}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const res = importSettingsJson(importJsonText);
                        if (res.success) {
                          showNotification(res.message, 'success');
                          setShowImportBox(false);
                          setImportJsonText('');
                        } else {
                          showNotification(res.message, 'error');
                        }
                      }}
                      className="px-5 py-2 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl hover:bg-amber-300"
                    >
                      Apply Backup
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone: Factory Reset */}
              <div className="p-6 rounded-2xl border border-red-950 bg-red-950/20 space-y-3">
                <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4" />
                  <span>DANGER ZONE // FACTORY RESET</span>
                </div>
                <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                  Permanently clear all custom browser cache and revert all site videos and texts back to their original master defaults.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all portfolio videos and texts to defaults?')) {
                      resetAllToDefaults();
                      showNotification('Site successfully reset to default showcase state.', 'info');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-sans font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Factory Reset Entire Site
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
