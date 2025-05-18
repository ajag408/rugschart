import CandleChart from './components/CandleChart'
import { SOLANA_COLORS } from './components/CandleChart' // We'll need to export this from CandleChart

function App() {
  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '2rem',
      background: `linear-gradient(to bottom, ${SOLANA_COLORS.dark}, #000)`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <header style={{
        width: '100%',
        textAlign: 'center',
        padding: '2rem 0'
      }}>
        <h1 style={{ 
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '3.5rem',
          fontWeight: 'bold',
          margin: 0,
          background: `linear-gradient(45deg, ${SOLANA_COLORS.primary}, ${SOLANA_COLORS.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 20px rgba(20, 241, 149, 0.3)`,
          letterSpacing: '0.1em'
        }}>
          Rug Chart
        </h1>
      </header>
      
      <main style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: `1px solid rgba(${SOLANA_COLORS.primary}, 0.1)`,
        backdropFilter: 'blur(8px)'
      }}>
        <CandleChart />
      </main>
    </div>
  )
}

export default App