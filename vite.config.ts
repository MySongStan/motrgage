/*
 * @Author: MySongStan 641281086@msn.cn
 * @Date: 2026-02-04 09:48:40
 * @LastEditors: MySongStan 641281086@msn.cn
 * @LastEditTime: 2026-02-04 10:02:39
 * @FilePath: \motrgage\vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
