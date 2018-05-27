'use strict';

module.exports = {
    tags: {
        allowUnknownTags: true,
        dictionaries: ['jsdoc']
    },
    source: {
        include: ['README.md', 'src', 'example.js'],
        includePattern: '.js$',
        excludePattern: '(node_modules/|docs)'
    },
    plugins: ['plugins/markdown'],
    templates: {
        cleverLinks: false,
        monospaceLinks: true,
        useLongnameInNav: false,
        showInheritedInNav: true
    },
    opts: {
        destination: './docs/',
        encoding: 'utf8',
        private: true,
        recurse: true,
        template: './node_modules/minami'
    }
};
