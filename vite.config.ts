import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import typedCssModulesPlugin from "vite-plugin-typed-css-modules";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(),typedCssModulesPlugin()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'chat-components', 
      fileName: "message",
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'es',
      },
    },
  },
})
