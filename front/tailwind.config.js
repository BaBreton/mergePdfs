/** @type {import('tailwindcss').Config} */

const { nextui } = require('@nextui-org/theme');

module.exports = {
  content: [
	'./src/**/*.{js,ts,jsx,tsx}',
	"./node_modules/@nextui-org/theme/dist/components/table.js",
	"./node_modules/@nextui-org/theme/dist/components/spinner.js",
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [nextui()],
}

