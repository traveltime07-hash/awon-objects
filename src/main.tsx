import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Aplikacja (Obiekty / role / itp.)
import App from './App'

// Landing (strona główna) – jeśli masz w src/pages/Landing.tsx:
import Landing from './pages/Landing'

const root = ReactDOM.createRoot(document.getElementById('root')!)

function render() {
  // /app oraz wszystko co dalej (np. /app/coś) – ładuj aplikację
  if (location.pathname.startsWith('/app')) {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } else {
    // w każdym innym przypadku – Landing (strona główna)
    root.render(
      <React.StrictMode>
        <Landing />
      </React.StrictMode>
    )
  }
}

// Pierwsze renderowanie
render()

// (opcjonalnie) Gdybyś kiedyś dodał nawigację pushState – można nasłuchiwać:
window.addEventListener('popstate', render)
