import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    // 允许 v0 预览沙箱域名访问 dev server
    allowedHosts: true,
    hmr: {
      // 通过代理/隧道访问时使用同源 wss
      clientPort: 443,
      protocol: 'wss'
    }
  }
})
