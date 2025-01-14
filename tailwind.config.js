module.exports = {
  content: [
    './src/**/*.njk',
    './src/**/*.svg',
    './src/assets/js/*.js'
  ],
  screens: {
    sm: '576px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },
  theme: {
    colors: {
      "vcard_bg": "#F9F5EA",
      "header_bg": "#FFEFA2",
      "body_bg": "#F3EEE1",
      "sidebar_bg": "#F7D57E",
      "footer_bg": "#FFEFA2",
      "highlight": "#926B00"
    },
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'blockquote': {
              fontWeight: 'normal',
              color: theme('colors.slate.600')
            },
            'blockquote p:first-of-type::before': {
              content: ''
            },
            'blockquote p:last-of-type::after': {
              content: ''
            }
          }
        }
      })
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
};
