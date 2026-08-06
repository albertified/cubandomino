import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Share2, Download, X, Link2, Sparkles, Maximize2, Minimize2, Eye } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  hostName?: string;
  targetScore?: number;
  initialBigMode?: boolean;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  hostName,
  targetScore = 150,
  initialBigMode = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBigMode, setIsBigMode] = useState(initialBigMode);

  if (!isOpen) return null;

  // Construct full shareable invite URL
  const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Cuban Dominoes Match!',
          text: `Join ${hostName ? `${hostName}'s` : 'my'} Cuban Dominoes (Double-Nine) table! Room Code: ${roomCode}`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('room-qr-code-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        // Draw pure dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 32, 32, 448, 448);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `cuban-dominoes-room-${roomCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Render HIGH CONTRAST BIG MODE for visibility across room / low vision
  if (isBigMode) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto">
          {/* Top Bar - High Contrast Controls */}
          <div className="w-full max-w-4xl flex items-center justify-between border-b-4 border-yellow-400 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-400 text-black font-mono font-black text-sm uppercase tracking-widest rounded">
                BIG MODE • HIGH CONTRAST
              </span>
              {hostName && (
                <span className="text-white font-mono font-bold text-base hidden sm:inline">
                  TABLE: {hostName.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBigMode(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-white text-white font-mono font-bold text-sm rounded flex items-center gap-2 cursor-pointer transition-all"
              >
                <Minimize2 className="w-5 h-5 text-yellow-400" />
                <span>NORMAL MODE</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded border-2 border-white cursor-pointer transition-all"
                aria-label="Close Big Mode"
              >
                <X className="w-7 h-7 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Main Central Area - Ultra Large Code & QR */}
          <div className="my-auto py-6 flex flex-col items-center text-center space-y-8 w-full max-w-3xl">
            {/* Label */}
            <div className="space-y-1">
              <p className="text-yellow-400 font-mono font-black text-xl sm:text-2xl uppercase tracking-widest">
                ROOM JOIN CODE
              </p>
              <p className="text-white font-mono font-bold text-sm sm:text-base">
                TARGET SCORE: {targetScore} POINTS
              </p>
            </div>

            {/* MASSIVE HIGH CONTRAST ROOM CODE BOX */}
            <div 
              onClick={handleCopyCode}
              className="w-full bg-black border-8 border-yellow-400 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(250,204,21,0.3)] hover:scale-[1.02] transition-transform cursor-pointer group"
            >
              <div className="text-6xl sm:text-8xl md:text-9xl font-mono font-black text-yellow-300 tracking-[0.2em] break-all drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
                {roomCode}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-yellow-400 group-hover:bg-yellow-300 text-black font-mono font-black text-base sm:text-xl uppercase rounded-full">
                {copiedCode ? <Check className="w-6 h-6 stroke-[3]" /> : <Copy className="w-6 h-6" />}
                <span>{copiedCode ? 'COPIED TO CLIPBOARD!' : 'TAP CODE TO COPY'}</span>
              </div>
            </div>

            {/* HIGH CONTRAST QR CODE */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-8 border-yellow-400 shadow-2xl flex flex-col items-center gap-3">
              <QRCodeSVG
                id="room-qr-code-svg"
                value={inviteUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              <p className="text-black font-mono font-black text-base uppercase tracking-wider">
                SCAN WITH CAMERA TO JOIN
              </p>
            </div>
          </div>

          {/* Bottom Bar Controls */}
          <div className="w-full max-w-4xl pt-4 border-t-4 border-yellow-400 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleCopyLink}
              className={`px-8 py-4 rounded-xl font-mono font-black text-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-3 border-4 ${
                copiedLink
                  ? 'bg-emerald-400 border-white text-black'
                  : 'bg-yellow-400 hover:bg-yellow-300 border-white text-black'
              }`}
            >
              {copiedLink ? <Check className="w-6 h-6 stroke-[3]" /> : <Link2 className="w-6 h-6 stroke-[3]" />}
              <span>{copiedLink ? 'INVITE LINK COPIED!' : 'COPY 1-CLICK INVITE LINK'}</span>
            </button>
          </div>
        </div>
      </AnimatePresence>
    );
  }

  // Standard Invite Modal
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-[#161619] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#fe7328]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#006876]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fe7328]/20 to-[#fbbf24]/20 border border-[#fe7328]/30 flex items-center justify-center text-[#fe7328] shadow-md">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  Invite Players
                  <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
                </h3>
                <p className="text-xs font-mono text-white/50">
                  {hostName ? `${hostName}'s Table` : 'Room Lobby'} • Target: {targetScore} PTS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBigMode(true)}
                className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-white/20 shadow-md"
                title="Switch to High-Contrast Big Mode across the room"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>BIG MODE</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Room Code Quick Box with BIG MODE Button */}
          <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3 relative z-10 shadow-inner">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-bold">
                ROOM CODE
              </span>
              <span className="text-2xl font-mono font-black text-[#fe7328] tracking-widest">
                {roomCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBigMode(true)}
                className="p-2 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 transition-all cursor-pointer"
                title="Open Big High-Contrast Display"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopyCode}
                className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  copiedCode
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                }`}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-[#fbbf24]" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center space-y-3 bg-[#0e0e10] border border-white/10 rounded-xl p-5 relative z-10 shadow-inner">
            <div className="p-3 bg-white rounded-2xl shadow-xl relative border-4 border-[#200d07] transform hover:scale-105 transition-transform duration-300">
              <QRCodeSVG
                id="room-qr-code-svg"
                value={inviteUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#111113"
                level="H"
                includeMargin={true}
              />
            </div>

            <button
              onClick={() => setIsBigMode(true)}
              className="text-xs font-mono text-yellow-400 hover:text-yellow-300 underline flex items-center gap-1 font-bold"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Enlarge for across-the-room scanning (Big Mode)</span>
            </button>
          </div>

          {/* Direct Invite Link & Actions */}
          <div className="space-y-2.5 relative z-10">
            <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#8debfd] shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-transparent font-mono text-xs text-white/80 focus:outline-none selection:bg-[#fe7328]/30 truncate"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* One Click Copy Button */}
              <button
                onClick={handleCopyLink}
                className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-lg ${
                  copiedLink
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-[#fe7328] hover:bg-[#fe7328]/90 border-[#fe7328] text-slate-950 shadow-[#fe7328]/20'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Copy One-Click Link</span>
                  </>
                )}
              </button>

              {/* Share / Download Option */}
              {typeof navigator !== 'undefined' && 'share' in navigator ? (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-[#8debfd]" />
                  <span>Share via Apps</span>
                </button>
              ) : (
                <button
                  onClick={handleDownloadQR}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#8debfd]" />
                  <span>Save QR Code</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
