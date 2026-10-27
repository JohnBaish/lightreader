import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Keep the libraries' licence notices (Astronomy Engine, React and the others, all MIT)
  // in the built scripts, as their licences ask; the build dropped them from the main script.
  build: { rolldownOptions: { output: { comments: { legal: true } } } },
})
