const path = require('path')

module.exports = {
    icon: async function (name, isSocial) {
        const id = name.toLowerCase().replace(/\s/g, '')
        const availableSocialIcons = [
            'github',
            'twitter',
            'linkedin',
            'skype',
            'dribbble',
            'behance',
            'medium',
            'reddit',
            'slack',
            'whatsapp'
        ]
        if (isSocial && !availableSocialIcons.includes(id)) {
            return `<span aria-hidden="true">${name}:&nbsp;</span>`
        }
        // const icon_path = path.resolve('src/_includes/icons/' + id + '.svg')
        // const response = await fetch(icon_path); 
        // console.log(response)
        // const source = await response.text();
        // return source;
        return `<svg class="icon icon--${id}" role="img" aria-hidden="true" width="24" height="24">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-${id}"></use>
                </svg>`
    }
}
