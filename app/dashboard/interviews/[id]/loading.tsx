export default function Loading() {
    return (
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#111113',
        minHeight: '100vh',
        padding: '40px 48px',
        maxWidth: 1100,
      }}>
        {/* Back button */}
        <div style={{ width: 120, height: 13, background: '#1E1E20', borderRadius: 6, marginBottom: 28 }} />
  
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ width: 200, height: 22, background: '#1E1E20', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: 100, height: 13, background: '#1E1E20', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 60, height: 36, background: '#1E1E20', borderRadius: 100 }} />
            <div style={{ width: 100, height: 36, background: '#1E1E20', borderRadius: 100 }} />
          </div>
        </div>
  
        {/* Two panel grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Left — config panel */}
          <div style={{ background: '#1E1E20', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 120, height: 13, background: '#2A2A2C', borderRadius: 6 }} />
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[80, 60, 100].map((w, i) => (
                <div key={i}>
                  <div style={{ width: 80, height: 10, background: '#2A2A2C', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '100%', height: w, background: '#2A2A2C', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
  
          {/* Right — links panel */}
          <div style={{ background: '#1E1E20', borderRadius: 14, overflow: 'hidden' }}>
            {/* Stat row */}
            <div style={{ display: 'flex', gap: 24, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {[60, 70, 55, 90].map((w, i) => (
                <div key={i}>
                  <div style={{ width: w, height: 10, background: '#2A2A2C', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 30, height: 20, background: '#2A2A2C', borderRadius: 4 }} />
                </div>
              ))}
            </div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {[40, 70, 55, 70, 55].map((w, i) => (
                <div key={i} style={{ width: w, height: 28, background: '#2A2A2C', borderRadius: 100 }} />
              ))}
            </div>
            {/* Rows */}
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div>
                  <div style={{ width: 140, height: 13, background: '#2A2A2C', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: 80, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
                </div>
                <div style={{ width: 64, height: 22, background: '#2A2A2C', borderRadius: 100 }} />
                <div style={{ width: 40, height: 13, background: '#2A2A2C', borderRadius: 4 }} />
                <div style={{ width: 80, height: 28, background: '#2A2A2C', borderRadius: 100, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }