import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/3dfolio/", // Assuming repo name is '3dfolio' based on package name, user can change if needed
})
