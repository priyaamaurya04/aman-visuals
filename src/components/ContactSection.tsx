import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { ArrowRight, Mail, Instagram, Linkedin, Youtube, Copy, Check, Sparkles, Send } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { contactContent, heroContent } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectType, setProjectType] = useState('Brand Film');
  const [projectTimeline, setProjectTimeline] = useState('2-4 Weeks');
  const [projectDetails, setProjectDetails] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const emailAddress = contactContent.email || 'aman.gupta.edits@gmail.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    // Construct mailto link
    const subject = encodeURIComponent(`[New Project Commission] ${projectType} - ${clientName}`);
    const body = encodeURIComponent(
      `Hi ${heroContent.name || 'Aman'},\n\nName: ${clientName}\nEmail: ${clientEmail}\nProject Type: ${projectType}\nTimeline: ${projectTimeline}\n\nProject Scope:\n${projectDetails}\n\nLooking forward to hearing from you.`
    );
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
  };

  const socialLinks = [
    { name: 'Email', handle: emailAddress, url: `mailto:${emailAddress}` },
    { name: 'Instagram', handle: contactContent.instagram.replace('https://instagram.com/', '@') || '@amangupta.edits', url: contactContent.instagram },
    { name: 'LinkedIn', handle: 'in/amangupta-editor', url: contactContent.linkedin },
    { name: 'YouTube', handle: '@AmanGuptaStoryteller', url: contactContent.youtube },
  ];

  const getSocialIcon = (name: string) => {
    switch (name) {
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Instagram': return <Instagram className="w-4 h-4" />;
      case 'LinkedIn': return <Linkedin className="w-4 h-4" />;
      case 'YouTube': return <Youtube className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <section id="contact" className="py-32 px-6 md:px-12 bg-[#050507] relative border-t border-zinc-900">
      {/* Background Soft Lighting Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
        {/* Section Header with Upward Animated Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-zinc-950 text-amber-400 text-xs font-mono tracking-[0.2em] uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INQUIRIES & COMMISSIONS // 2025 - 2026</span>
          </div>

          <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
            CONTACT
          </h2>
        </motion.div>

        {/* Massive Closing Statement */}
        <h3 className="font-heading font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[0.95] uppercase">
          {contactContent.headline || "LET'S BUILD SOMETHING CINEMATIC."}
        </h3>

        <p className="font-sans text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {contactContent.subheadline || 'Open for director commissions, agency partnerships, brand campaigns, and post-production supervision.'}
        </p>

        {/* Action Button: START A PROJECT → */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-5">
          <button
            onClick={() => setIsModalOpen(true)}
            id="start-project-btn"
            className="group px-9 py-5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-sans font-bold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.7)] hover:scale-105 flex items-center space-x-3"
          >
            <span>START A PROJECT</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Quick Copy Email Button */}
          <button
            onClick={copyEmail}
            className="px-6 py-5 rounded-full border border-zinc-800 hover:border-zinc-600 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 font-mono text-xs tracking-wider transition-all flex items-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4 text-zinc-500" />}
            <span>{copied ? 'EMAIL COPIED TO CLIPBOARD' : emailAddress}</span>
          </button>
        </div>

        {/* Social Links Grid */}
        <div className="pt-16 border-t border-zinc-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-zinc-800/80 bg-[#09090d] hover:border-amber-400/50 hover:bg-zinc-900 transition-all flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-2 rounded-full bg-zinc-800 text-zinc-300 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                  {getSocialIcon(link.name)}
                </div>
                <span className="font-heading font-bold text-sm tracking-tight text-white group-hover:text-amber-300 transition-colors uppercase">
                  {link.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[120px]">
                  {link.handle}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer Credit & Film Director Sign-off */}
        <div className="pt-16 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 border-t border-zinc-900">
          <div className="font-sans text-xs text-zinc-400">
            © {new Date().getFullYear()} <span className="text-zinc-200 font-medium">AMAN GUPTA</span> • VIDEO EDITOR & VISUAL STORYTELLER
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span className="font-mono text-zinc-600 text-[11px]">
              CUT AT 23.976 FPS • MASTERED IN ACES
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Commission Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div className="w-full max-w-xl rounded-2xl bg-[#0c0c12] border border-zinc-800 p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-white uppercase tracking-tight">START A PROJECT</h3>
                <p className="text-xs font-sans text-zinc-400">Direct transmission to Aman Gupta&apos;s cutting room.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">YOUR NAME</label>
                  <input
                    type="text"
                    required
                    value={clientName ?? ''}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Director"
                    className="w-full px-3 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">YOUR EMAIL</label>
                  <input
                    type="email"
                    required
                    value={clientEmail ?? ''}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="director@studio.com"
                    className="w-full px-3 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-sans text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">PROJECT TYPE</label>
                  <select
                    value={projectType ?? 'Brand Film'}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-sans text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option>Brand Film</option>
                    <option>Commercial</option>
                    <option>Social Campaign</option>
                    <option>Music Video</option>
                    <option>YouTube Docu-Series</option>
                    <option>Short Film</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">ESTIMATED TIMELINE</label>
                  <select
                    value={projectTimeline ?? '2-4 Weeks'}
                    onChange={(e) => setProjectTimeline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-sans text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option>Rush (&lt; 1 Week)</option>
                    <option>2 - 4 Weeks</option>
                    <option>1 - 2 Months</option>
                    <option>Flexible / In Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium block mb-1">PROJECT DETAILS / FOOTAGE SPECS</label>
                <textarea
                  rows={4}
                  required
                  value={projectDetails ?? ''}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  placeholder="Tell me about the story, runtime, camera package, deliverables, and vision..."
                  className="w-full px-3 py-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-sans text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-sans font-bold text-xs md:text-sm tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>TRANSMIT BRIEF →</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
