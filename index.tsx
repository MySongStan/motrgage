/*
 * @Author: MySongStan 641281086@msn.cn
 * @Date: 2026-02-04 09:48:40
 * @LastEditors: MySongStan 641281086@msn.cn
 * @LastEditTime: 2026-02-04 10:19:59
 * @FilePath: \motrgage\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Index.tsx is loaded!');
console.log('Current directory:', import.meta.url);

const rootElement = document.getElementById('root');
console.log('Root element found:', !!rootElement);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log('Root created, rendering App...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('App rendered successfully!');
