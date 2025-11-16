import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Public from './pages/Public'
import ProcessDetail from './pages/ProcessDetail'
import logo from './assets/logo.svg'

function Private({ children }) {
  const { keycloak, initialized } = useKeycloak()
  if (!initialized) return <div style={{padding:16}}>Loading auth…</div>
  return keycloak.authenticated ? children : <Navigate to="/" replace />
}

function Layout() {
  const { keycloak, initialized } = useKeycloak()
  const location = useLocation()

  if (!initialized) return <div style={{padding:16}}>Loading…</div>


  if (location.pathname === '/' && !keycloak.authenticated) {
    keycloak.login({ redirectUri: window.location.origin + '/dashboard' })
    return null 
  }

  return (
    <>
      <header style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid #eee'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
        <img src={logo} alt="ei-t" style={{height:40}} />
        <Link to="/dashboard" style={{fontSize:18, fontWeight:500,color:'inherit',textDecoration:'none'}}>Dashboard</Link>
        </div>
        {/* <Link to="/public">Public</Link> */}
        <div style={{marginLeft:'auto', marginRight:12}}>
          {keycloak.authenticated ? (
            <>
              <span style={{marginRight:12}}>{keycloak.tokenParsed?.preferred_username}</span>
              <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>Logout</button>
            </>
          ) : (
            <button onClick={() => keycloak.login({ redirectUri: window.location.origin + '/dashboard' })}>Login</button>
          )}
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/public" element={<Public/>} />
        <Route path="/dashboard" element={<Private><Dashboard/></Private>} />
        <Route path="/process/:id" element={<Private><ProcessDetail/></Private>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout/>
    </BrowserRouter>
  )
}
