// Get our requirements, installed by npm
const Metalsmith = require('metalsmith');
const ignore = require('metalsmith-ignore');
const defaultValues = require('@metalsmith/default-values');
const favicons = require('metalsmith-favicons');
const discoverHelpers = require('metalsmith-discover-helpers');
const nested = require('metalsmith-nested');
const discoverPartials = require('metalsmith-discover-partials');
const ancestry = require("metalsmith-ancestry");
const autoDefaults = require("./lib/metalsmith-auto-defaults");
const inPlace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const externalLinks = require("./lib/metalsmith-external-links");
const prefixoid = require('metalsmith-prefixoid');
const sass = require('metalsmith-dart-sass');
const webpack = require('@goodthnx/metalsmith-webpack')

var site_url = ""
if (process.argv.length > 2) {
    site_url = process.argv[2];
}
site_url = site_url.replace(/\/?$/, ""); // enforce no ending slash

var site_default_params = {
    title: "SchildiChat",
    description: "SchildiChat matrix messenger",
    layout: 'default.hbs',
    stylesheet: 'base.css',
    copyright_date: new Date().getFullYear(),
    nav_show: true,
    parent_subpages: false,
    main_page: false,
    needs_link_to_top: true,
    order_id: 50,
    overview_list: false,
    hide_page_title: false,
    nav_show: true
}

// Run Metalsmith in the current directory.
// When the .build() method runs, this reads
// and strips the frontmatter from each of our
// source files and passes it on to the plugins.
Metalsmith(__dirname)

    .metadata({
        site_url: site_url
    })

    .use(ignore(['**/.gitignore']))

    // frontmatter (thing in markdown before actual markdown) default values
    .use(defaultValues([
        {
            pattern: '**/*.{html,md,hbs,md.hbs,fakechild}',
            defaults: site_default_params
        },
        {
            pattern: 'error/**/*',
            defaults: { nav_show: false }
        }
    ]))

    .use(favicons({
        src: 'img/SchildiChat_nopadding.svg',
        dest: 'img/favicons/',
        icons: {
            favicons: true
        }
    }))
    .use(ignore(['img/favicons/manifest.json']))

    // Helpers to use in *.hbs files
    .use(discoverHelpers())

    // Allow nesting layouts // WARN: don't use layouts directory directly after that
    .use(nested({
        directory: 'layouts',
        generated: 'build-layouts'
    }))

    // Partials to include in *.hbs files
    .use(discoverPartials({
        directory: 'partials',
        pattern: /\.hbs$/
    }))

    // Ancestry allows access to parents and children.
    .use(ancestry({
        sortBy: ["order_id", "title"],
        sortFilesFirst: "**/index.*",
        match: "**/*.{html,md,hbs,md.hbs,fakechild}"
    }))

    // Dynamic auto-defaults, to be called after default_values and ancestry
    .use(autoDefaults({
        createUriFromPath: (path) => {
            return path
                .replace(/\.(md|hbs|md\.hbs)$/, ".html")
                .replace(/(^|\/|\\)index.*$/, "$1")
                .replace(/^\/?/, "/");
        }
    }))

    .use(inPlace({
        engineOptions: {
            html: true
        }
    }))

    // Put the HTML fragments from the steps above
    // into our template, using the Frontmatter
    // properties as template variables.
    .use(layouts({
        // Generated by nested
        directory: 'build-layouts',
    }))

    // After layouts, these might add some links as well
    .use(externalLinks({
        matchNegative: ["^https?:\/\/([^\/]*\.)?schildi\.chat.*"]
    }))

    .use(prefixoid([
        {
            prefix: site_url,
            convert_relatives: false,
            tag: 'link',
            attr: 'href'
        }, {
            prefix: site_url,
            convert_relatives: false,
            tag: 'a',
            attr: 'href'
        }, {
            prefix: site_url,
            convert_relatives: false,
            tag: 'object',
            attr: 'data'
        }, {
            prefix: site_url,
            convert_relatives: false,
            tag: 'img',
            attr: 'src'
        }
    ]))

    .use(ignore(['**/*.fakechild']))
    .use(ignore(['img/icons/orig/**']))

    // sass -> css
    .use(sass())

    // webpack for js
    .use(webpack({
        pattern: 'js/bundle.js',
        config: './webpack.config.js'
    }))

    // And tell Metalsmith to fire it all off.
    .build(function(err) {
        if (err) { throw err; }
    });
