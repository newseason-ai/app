export default function Loading() {
    return (
      <div style={{ padding: '40px 48px', maxWidth: 1100, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ width: 120, height: 20, background: '#1E1E20', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: 80, height: 13, background: '#1E1E20', borderRadius: 6 }} />
          </div>
          <div style={{ width: 130, height: 38, background: '#1E1E20', borderRadius: 100 }} />
        </div>
        <div style={{ background: '#1E1E20', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px', gap: 12, padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[200, 60, 50, 70, 90].map((w, i) => (
              <div key={i} style={{ width: w, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <div>
                <div style={{ width: 180, height: 13, background: '#2A2A2C', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 280, height: 10, background: '#2A2A2C', borderRadius: 4 }} />
              </div>
              <div style={{ width: 56, height: 22, background: '#2A2A2C', borderRadius: 100 }} />
              <div style={{ width: 24, height: 13, background: '#2A2A2C', borderRadius: 4 }} />
              <div style={{ width: 24, height: 13, background: '#2A2A2C', borderRadius: 4 }} />
              <div style={{ width: 60, height: 13, background: '#2A2A2C', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }