import CandleChart from './components/CandleChart'

function App() {
  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Rug Chart</h1>
      <CandleChart />
    </div>
  )
}

export default App