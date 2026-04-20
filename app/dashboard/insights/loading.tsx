export default function Loading() {
    return (
      <div style={{ padding: '36px 44px', maxWidth: 1100, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ width: 100, height: 20, background: '#1E1E20', borderRadius: 6 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 180, height: 36, background: '#1E1E20', borderRadius: 8 }} />
            <div style={{ width: 120, height: 36, background: '#1E1E20', borderRadius: 100 }} />
          </div>
        </div>
        <div style={{ background: '#1A1A1C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 20 }}>
          {[60, 140, 160, 100].map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: 60, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
              <div style={{ width: w, height: 20, background: '#2A2A2C', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        {[1, 2].map(i => (
          <div key={i} style={{ background: '#1E1E20', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 140, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
            </div>
            {[1, 2, 3].map(j => (
              <div key={j} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ width: 200, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
                  <div style={{ width: 80, height: 18, background: '#2A2A2C', borderRadius: 100 }} />
                </div>
                <div style={{ width: '85%', height: 13, background: '#2A2A2C', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '60%', height: 13, background: '#2A2A2C', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }