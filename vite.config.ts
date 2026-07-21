import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { jiraStatusesPlugin } from './vite-plugin-jira-statuses'

function figmaAssetPlugin(): Plugin {
  return {
    name: 'figma-asset-resolver',
    transformIndexHtml(html) {
      return html.replace(/figma:asset\//g, '/assets/')
    },
    transform(code, id) {
      if (/\.(tsx?|jsx?)$/.test(id) && code.includes('figma:asset/')) {
        return code.replace(/figma:asset\//g, '/assets/')
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetPlugin(),
    jiraStatusesPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    /** Avoid multiple React copies in @vite/deps (invalid hooks / useId on null with PatternFly + Router). */
    dedupe: ['react', 'react-dom', '@patternfly/react-core'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  },
  build: {
    // PatternFly + app routes in one graph often exceed 500 kB; gzip ~516 kB is acceptable for this prototype.
    chunkSizeWarningLimit: 2200,
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
