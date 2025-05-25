const isEmpty = require('lodash/isEmpty')
const site = require('../src/_data/site.js')

module.exports = {
    stripSpaces: function (str) {
        return str.replace(/\s/g, '')
    },

    stripProtocol: function (str) {
        return str.replace(/(^\w+:|^)\/\//, '')
    },

    stripExtension: function (filename) {
        return filename.substring(0, filename.lastIndexOf('.'));
    },

    themeColors: function (colors) {
        let style = ''
        if (!colors || isEmpty(colors)) {
            return ''
        }
        if (colors.primary) {
            style += `--primary-color:${colors.primary};`
        }
        if (colors.secondary) {
            style += `--secondary-color:${colors.secondary};`
        }
        return style
    },

    absoluteURI: function(link) {
        const parent = 
            process.env.NODE_ENV === 'production' 
                ? site.url
                : "http://localhost:8080";
        return parent + '/' + link;
    }
}
