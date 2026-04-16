export default function Loading() {
    return (
      <div style={{ padding: '40px 48px', maxWidth: 860, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: 140, height: 13, background: '#1E1E20', borderRadius: 6, marginBottom: 28 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ width: 200, height: 22, background: '#1E1E20', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: 260, height: 12, background: '#1E1E20', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', background: '#1E1E20', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, padding: '14px 20px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 60, height: 10, background: '#2A2A2C', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 40, height: 16, background: '#2A2A2C', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ background: '#1E1E20', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 40, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', gap: 8 }}>
            {[100, 120, 80, 110].map((w, i) => (
              <div key={i} style={{ width: w, height: 26, background: '#2A2A2C', borderRadius: 100 }} />
            ))}
          </div>
        </div>
        <div style={{ background: '#1E1E20', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 80, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ width: 24, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
                <div style={{ width: 28, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
              </div>
              <div style={{ width: `${60 + (i * 13) % 40}%`, height: 13, background: '#2A2A2C', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }