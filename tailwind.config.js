/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		screens: {
  			xs: {
  				max: '320px'
  			},
  			sm: {
  				max: '768px'
  			},
  			md: {
  				min: '769px',
  				max: '1024px'
  			},
  			lg: {
  				min: '1025px',
  				max: '1440px'
  			},
  			xl: {
  				min: '1441px'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}