"use client";

import type { ReactNode } from "react";

type LandingScreenProps = {
  company: { name: string; slug: string; logoUrl: string | null };
  template: { openingPrompt: string; directedQuestions: unknown; targetDurationS: number };
  onNext: () => void;
};

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{width:16,height:16,color:'#71717a'}} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5l3 1.8" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{width:16,height:16,color:'#71717a'}} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6.5 11.5a5.5 5.5 0 1 0 11 0" /><path d="M12 17v4" />
    </svg>
  );
}

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:14,fontWeight:500,color:'#3f3f46'}}>
      {icon}<span>{label}</span>
    </div>
  );
}

export function LandingScreen({ company, template, onNext }: LandingScreenProps) {
  const minutes = Math.max(1, Math.round(template.targetDurationS / 60));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#FAFAF8',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#18181b',
      padding: '0 24px',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
    }}>
      <div style={{maxWidth:390,width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',height:'100%'}}>
        
        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <span style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>{company.name}</span>
          <span style={{background:'#CCFBF1',color:'#0F766E',borderRadius:999,padding:'6px 14px',fontSize:14,fontWeight:600}}>
            {minutes} min
          </span>
        </div>

        {/* Main content — grows to fill space */}
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'top-start',gap:18}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#71717a',margin:'0 0 8px'}}>
            WITH NEWSEASON.AI
          </p>

          <h1 style={{fontSize:31,fontWeight:800,lineHeight:1.1,letterSpacing:-0.5,margin:0}}>
            Help shape what we build next
          </h1>

          <p style={{fontSize:16,fontWeight:500,lineHeight:1.5,color:'#3f3f46',margin:0}}>
            We'd love to hear what's working and what's on your mind — in your own words.
          </p>

          <div style={{display:'flex',gap:20,alignItems:'center'}}>
            <MetaChip icon={<ClockIcon />} label={`~${minutes} min`} />
            <MetaChip icon={<MicIcon />} label="Voice conversation" />
          </div>

          <div style={{background:'#EEEEE6',border:'1px solid #d4d4d8',borderRadius:20,padding:'16px 20px'}}>
            <h2 style={{fontSize:17,fontWeight:700,lineHeight:1.2,margin:'0 0 8px'}}>
              Your feedback shapes the product
            </h2>
            <p style={{fontSize:15,fontWeight:500,lineHeight:1.5,color:'#3f3f46',margin:0}}>
              You invested in {company.name} — tell us what matters most to you and we'll build it.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{paddingTop:8}}>
          <button
            type="button"
            onClick={() => onNext()}
            onTouchEnd={(e) => {
              e.preventDefault();
              onNext();
            }}
            style={{
              width:'100%',borderRadius:999,background:'#18181b',color:'#fff',
              border:'none',padding:'18px 28px',fontSize:16,fontWeight:600,
              cursor:'pointer',WebkitAppearance:'none',marginBottom:12,
            }}
          >
            Start conversation
          </button>
          <p style={{textAlign:'center',fontSize:13,color:'#71717a',margin:0,lineHeight:1.4}}>
            Powered by voice AI · your feedback goes to {company.name}
          </p>
        </div>

      </div>
    </div>
  );
}