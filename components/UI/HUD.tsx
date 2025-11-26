import React, { useState, useEffect, useRef } from 'react';
import { SystemState, ContinentData, InteractionState } from '../../types';

interface HUDProps {
  systemState: SystemState;
  continentData: ContinentData;
  interactionState: React.MutableRefObject<InteractionState>;
}

export const HUD: React.FC<HUDProps> = ({ systemState, continentData, interactionState }) => {
  const [time, setTime] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([]);
  const floatingPanelRef = useRef<HTMLDivElement>(null);
  
  // Ref for panel position
  const panelPos = useRef({ x: window.innerWidth - 320, y: window.innerHeight / 2 - 150 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate random system logs
  useEffect(() => {
      const interval = setInterval(() => {
          const sysLogs = [
              "CALIBRATING_SENSORS...", "PACKET_LOSS_0.002%", "HANDSHAKE_ESTABLISHED", 
              "UPDATING_GEO_CACHE", "SCANNING_FREQ_RANGE", "ENCRYPTING_DATA_STREAM",
              "OPTIMIZING_RENDER_PIPELINE", "DETECTING_BIOMETRICS"
          ];
          const newLog = `> ${sysLogs[Math.floor(Math.random() * sysLogs.length)]} [${Math.random().toFixed(3)}s]`;
          setLogs(prev => [newLog, ...prev].slice(0, 6));
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  // Panel Dragging Logic Loop
  useEffect(() => {
    let animationFrameId: number;

    const updateUI = () => {
      const { rightHand } = interactionState.current;
      const panel = floatingPanelRef.current;

      if (panel) {
        if (rightHand.detected && rightHand.isPinching) {
          // Hand coordinates are 0-1.
          const targetX = (1 - rightHand.position.x) * window.innerWidth; // Mirror X
          const targetY = rightHand.position.y * window.innerHeight;

          // Smooth follow - Increased factor for snappier response (0.2 -> 0.25)
          panelPos.current.x += (targetX - panelPos.current.x - 150) * 0.25;
          panelPos.current.y += (targetY - panelPos.current.y - 50) * 0.25;
          
          panel.style.transform = `translate(${panelPos.current.x}px, ${panelPos.current.y}px) scale(1.05)`;
          panel.style.borderColor = '#ffffff';
          panel.style.boxShadow = '0 0 20px rgba(0,255,255,0.6)';
        } else {
           // Release
           panel.style.transform = `translate(${panelPos.current.x}px, ${panelPos.current.y}px) scale(1)`;
           panel.style.borderColor = 'rgba(0, 255, 255, 0.3)';
           panel.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.1)';
        }
      }

      animationFrameId = requestAnimationFrame(updateUI);
    };

    updateUI();
    return () => cancelAnimationFrame(animationFrameId);
  }, [interactionState]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-mono overflow-hidden">
      
      {/* --- DECORATIVE CORNERS (SVG) --- */}
      <svg className="absolute top-4 left-4 w-32 h-32 opacity-80" viewBox="0 0 100 100">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#00FFFF" strokeWidth="2" />
        <path d="M0 25 L0 100" fill="none" stroke="#00FFFF" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
        <path d="M25 0 L100 0" fill="none" stroke="#00FFFF" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
        <rect x="5" y="5" width="5" height="5" fill="#00FFFF" />
      </svg>
      <svg className="absolute top-4 right-4 w-32 h-32 opacity-80 rotate-90" viewBox="0 0 100 100">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#00FFFF" strokeWidth="2" />
        <rect x="5" y="5" width="5" height="5" fill="#00FFFF" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-32 h-32 opacity-80 -rotate-90" viewBox="0 0 100 100">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#00FFFF" strokeWidth="2" />
        <rect x="5" y="5" width="5" height="5" fill="#00FFFF" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-32 h-32 opacity-80 rotate-180" viewBox="0 0 100 100">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="#00FFFF" strokeWidth="2" />
        <path d="M0 25 L0 100" fill="none" stroke="#00FFFF" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
        <path d="M25 0 L100 0" fill="none" stroke="#00FFFF" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
        <rect x="5" y="5" width="5" height="5" fill="#00FFFF" />
      </svg>

      {/* --- CENTER RETICLE --- */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[400px] h-[400px] border border-cyan-500/20 rounded-full flex items-center justify-center relative">
               <div className="w-[380px] h-[380px] border border-dashed border-cyan-500/30 rounded-full animate-spin-slow"></div>
               <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
               <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
          </div>
      </div>

      {/* --- TOP HEADER --- */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pt-6 px-12 border-b border-cyan-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-cyan-400 animate-spin-slow flex items-center justify-center relative shadow-[0_0_10px_#00FFFF]">
                <div className="absolute inset-0 border-t-2 border-cyan-200 rounded-full animate-ping opacity-20"></div>
                <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#00FFFF]"></div>
            </div>
            <div className="flex flex-col">
                 <span className="text-[10px] text-cyan-200 tracking-[0.3em]">SYSTEM STATUS</span>
                 <span className={`text-xl font-bold font-sans tracking-widest ${systemState === SystemState.ACTIVE ? 'text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'text-yellow-400'}`}>
                    {systemState}
                 </span>
            </div>
        </div>

        <div className="flex flex-col items-end">
            <h1 className="text-4xl font-bold text-white text-glow tracking-[0.2em] font-sans" style={{textShadow: '0 0 10px #00FFFF'}}>C.Y.R.U.S</h1>
            <div className="flex items-center gap-2 mt-1">
                 <span className="h-1 w-16 bg-cyan-500/50"></span>
                 <p className="text-cyan-300 text-sm tracking-widest font-mono">{time.toLocaleTimeString()}</p>
            </div>
        </div>
      </div>

      {/* --- BOTTOM SYSTEM LOGS --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3 text-center hidden lg:block">
           <div className="flex flex-col-reverse items-center gap-1 h-20 overflow-hidden text-[10px] text-cyan-600 font-mono uppercase tracking-wider fade-mask-y">
                {logs.map((log, i) => (
                    <span key={i} className={`${i===0 ? 'text-cyan-300' : 'opacity-50'}`}>{log}</span>
                ))}
           </div>
           <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-2"></div>
      </div>

      {/* --- LEFT SIDEBAR (Hand Status) --- */}
      <div className="absolute bottom-12 left-12 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-tl-xl w-64 border-l-4 border-l-cyan-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-cyan-500/50"></div>
            <h3 className="text-cyan-400 text-sm border-b border-cyan-500/50 pb-1 mb-2 tracking-wider flex justify-between">
                <span>MANUAL_OVERRIDE</span>
                <span className="text-[10px] animate-pulse">V.2.0.4</span>
            </h3>
            <div className="space-y-3 text-xs text-cyan-100 font-mono">
                <div className="flex justify-between items-center bg-cyan-900/30 p-1">
                    <span>L_HAND [TERRAFORM]</span>
                    <span className={`w-2 h-2 rounded-full ${interactionState.current.leftHand.detected ? 'bg-cyan-400 shadow-[0_0_8px_#00FFFF]' : 'bg-red-900'} transition-colors`}></span>
                </div>
                 <div className="flex justify-between items-center bg-cyan-900/30 p-1">
                    <span>R_HAND [INTERFACE]</span>
                    <span className={`w-2 h-2 rounded-full ${interactionState.current.rightHand.detected ? 'bg-cyan-400 shadow-[0_0_8px_#00FFFF]' : 'bg-red-900'} transition-colors`}></span>
                </div>
            </div>
        </div>
      </div>

      {/* --- RIGHT FLOATING PANEL (Draggable) --- */}
      <div 
        ref={floatingPanelRef}
        className="absolute w-80 glass-panel clip-corner-br p-0 flex flex-col transition-shadow duration-200 z-30"
        style={{ transform: `translate(${panelPos.current.x}px, ${panelPos.current.y}px)` }}
      >
        <div className="bg-cyan-950/80 p-2 border-b border-cyan-500/50 flex justify-between items-center cursor-move">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-cyan-400"></span>
                <span className="text-xs font-bold text-cyan-300 tracking-widest">GEO_INTEL_ANALYSIS</span>
            </div>
            <div className="text-[8px] text-cyan-600">DRAG_ENABLED</div>
        </div>
        
        <div className="p-5 space-y-4 relative">
             <div className="absolute top-2 right-2 w-2 h-2 border border-cyan-500/50"></div>
             
            {/* Dynamic Content */}
            <div>
                <span className="text-[10px] text-cyan-400 block mb-1 tracking-widest">TARGET_ZONE //</span>
                <div className="text-3xl font-bold text-white text-glow font-sans">{continentData.name}</div>
                <div className="text-xs text-cyan-200 mt-1 font-mono bg-cyan-900/30 inline-block px-1">ID: {continentData.code}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyan-900/20 p-2 border-l border-cyan-500/40">
                    <span className="text-[9px] text-cyan-500 block mb-1">THREAT_LVL</span>
                    <span className={`text-xl font-bold ${continentData.activity === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-cyan-300'}`}>
                        {continentData.activity}
                    </span>
                </div>
                <div className="bg-cyan-900/20 p-2 border-l border-cyan-500/40">
                    <span className="text-[9px] text-cyan-500 block mb-1">POPULATION</span>
                    <span className="text-xl font-bold text-cyan-300">{continentData.population}</span>
                </div>
            </div>

            {/* Fake Data Stream */}
            <div className="h-20 overflow-hidden relative border-t border-dashed border-cyan-500/30 pt-2 mt-2">
                 <div className="text-[9px] font-mono text-cyan-600 leading-tight">
                    {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="opacity-70 flex justify-between">
                            <span>DATALINK_{i}</span>
                            <span>[OK]</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>

      {/* --- SCANNLINES & VIGNETTE --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>
      <div className="absolute w-full h-1 bg-cyan-400/20 animate-scanline blur-[2px]"></div>

    </div>
  );
};