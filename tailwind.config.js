/*
 * @Author: MySongStan 641281086@msn.cn
 * @Date: 2026-02-04 10:12:51
 * @LastEditors: MySongStan 641281086@msn.cn
 * @LastEditTime: 2026-02-04 10:13:21
 * @FilePath: \motrgage\tailwind.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}