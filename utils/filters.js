const fs = require('fs')
const path = require('path')
const mime = require('mime/lite')
const { DateTime } = require('luxon')
const isEmpty = require('lodash/isEmpty')
const site = require('../src/_data/site.js')

module.exports = {
    stripSpaces: function (str) {
        return str.replace(/\s/g, '')
    },

    stripProtocol: function (str) {
        return str.replace(/(^\w+:|^)\/\//, '')
    },

    base64file: function (file) {
        const filepath = path.join(__dirname, `../src/${file}`)
        const mimeType = mime.getType(file)
        const buffer = Buffer.from(fs.readFileSync(filepath))

        return `data:${mimeType};base64,${buffer.toString('base64')}`
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
