import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { ViewAsProvider } from './contexts/ViewAsContext'
import './index.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800.css'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ViewAsProvider>
      <App />
    </ViewAsProvider>
  </HelmetProvider>
);
