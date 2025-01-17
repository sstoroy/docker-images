const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')
const iconsprite = require('./utils/iconsprite.js')

module.exports = (config) => {
  config.addPassthroughCopy('src/assets/img/**/*');

  config.addWatchTarget("src/assets/js/");

  config.addLayoutAlias('default', 'layouts/default.njk');

  // create the archives and let eleventy access the information
  config.addGlobalData('apps', require('./utils/dockerArchiver.js'));

  // Filters
  config.addFilter('minifyJs', require('./utils/minifyJs'));
  Object.keys(filters).forEach((filterName) => {
      config.addFilter(filterName, filters[filterName])
  })

  // Transforms
  Object.keys(transforms).forEach((transformName) => {
      config.addTransform(transformName, transforms[transformName])
  })

  // Shortcodes
  Object.keys(shortcodes).forEach((shortcodeName) => {
      config.addShortcode(shortcodeName, shortcodes[shortcodeName])
  })
  
  // Icon Sprite
  config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
    // pathPrefix: "/subfolder/",
    templateFormats: ['md', 'njk', 'html'],
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};
