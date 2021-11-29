import fs from 'fs-extra'
import test from 'ava'
// import MarkdownIt from 'markdown-it'

import { isValidHttpUrl } from '../helpers/check-types.js'
import { buildReadmeAppList } from '../helpers/build-app-list.js'


require('dotenv').config()

// const md = new MarkdownIt()

const allowedTitleCharacters = new Set( 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 -_.®/\()音乐体验版'.split('') )

// Detect Emojis(Extended Pictograph) in string
// https://stackoverflow.com/a/64007175/1397641
function hasEmoji ( string ) {
    return /\p{Extended_Pictographic}/u.test( string )
}

test.before(async t => {
    const readmeFileContent = await fs.readFile('./README.md', 'utf-8')


    // Store sitemap urls to context
    t.context.readmeFileContent = readmeFileContent
    t.context.readmeAppList = buildReadmeAppList({
        readmeContent: t.context.readmeFileContent,
        scanListMap: new Map(),
        commits: []
    })
})

test('README Apps are formated correctly', (t) => {
    // console.log('t.context.sitemapUrls', t.context.sitemapUrls)

    const {
        readmeAppList
    } = t.context

    // t.log('readmeAppList', readmeAppList.length)

    const foundApps = new Set()


    for (const readmeApp of readmeAppList) {
        const cleanedAppName = readmeApp.name//.toLowerCase()

        // Check that app has not already been found
        if (foundApps.has(cleanedAppName)) {
            t.fail(`Duplicate app found: ${readmeApp.name}`)
            return
        }
        foundApps.add(cleanedAppName)

        // Check that all related links urls are valid
        for (const relatedLink of readmeApp.relatedLinks) {
            if ( !isValidHttpUrl( relatedLink.href ) ) {
                t.log('relatedLink.href', readmeApp.name, relatedLink.href)

                t.fail(`README App ${readmeApp.name} does not have valid url`, readmeApp.url)
            }
        }


        // Check that status text is free of markdown
        if ( readmeApp.text.includes('](') ) {
            t.fail(`README App ${readmeApp.name} markdown in status text`)
        }

        // Check that status has an emoji
        if ( hasEmoji( readmeApp.text ) === false ) {
            t.fail(`README App ${readmeApp.name} does not have emoji`)
        }

        // Check for not allowed characters in app name
        for ( const character of cleanedAppName ) {
            if ( !allowedTitleCharacters.has( character ) ) {

                // badCharacter = readmeApp.name[firstBadCharacterIndex]

                // t.log( readmeApp )
                t.fail(`README App Title ${readmeApp.name} has non-alphanumeric character ${character}(charCode ${character.charCodeAt(0)})`)

                break
            }
        }
        // t.log('All titles alphanumeric')

    }

    // const urlsWithDoubleSlashes = t.context.sitemapUrls.filter( url => url.pathname.includes('//') )

    // if ( urlsWithDoubleSlashes.length > 0) {
    //     t.fail( `${ urlsWithDoubleSlashes.length } urls with doubles slashes found including ${ urlsWithDoubleSlashes[0] }` )
    // }

    t.log( `${readmeAppList.length} apps in readme` )

    t.pass()
})


function sortAppsAlphabetically ( a, b ) {
    return a.name.localeCompare(b.name)
}


test('README Apps are in alphbetical order', (t) => {

    const {
        readmeAppList
    } = t.context

    const appsByCategory = new Map()



    // Group apps by category
    for ( const readmeApp of readmeAppList ) {
        const category = readmeApp.category.slug

        if ( !appsByCategory.has(category) ) {
            appsByCategory.set(category, [])
        }

        appsByCategory.get( category ).push(readmeApp)
    }

    // Sort apps in groups alphabetically
    for ( const [ category, apps ] of appsByCategory ) {

        const unsortedApps = apps.slice()

        // Sort apps in category in place
        apps.sort(sortAppsAlphabetically)

        // Check sorted sorted apps against unsorted apps
        for ( const [ index, unsortedApp ] of unsortedApps.entries() ) {
            const sortedApp = apps[index]

            if ( sortedApp.slug !== unsortedApp.slug ) {
                t.fail(`README App at index ${index} of ${category} is ${unsortedApp.name} but should be ${sortedApp.name}`)
            }
        }
    }

    t.pass()
})

