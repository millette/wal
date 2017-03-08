'use strict'

// npm
require('dotenv-safe').load({ allowEmptyValues: true })
if (!process.env.DB) {
  console.error('Required env variable: DB.')
  process.exit(1)
}
const chokidar = require('chokidar')
const CouchdbChangeEvents = require('couchdb-change-events')

const watcher = chokidar.watch('data/**/*.json', { // data
  ignoreInitial: true,
  followSymlinks: false,
  alwaysStat: true,
  // awaitWriteFinish: false
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
})

watcher.on('ready', () => console.log('Ready!'))

watcher.on('error', (error) => {
  if (error.errno === 'ENOSPC') {
    watcher.close()
    console.error(`Out of inotify space. Increase it with the following command:

echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

The change to this config will remain after a reboot.`)
    process.exit(1)
  }
  console.error(error)
})

const evs = ['add', 'addDir', 'change', 'unlink', 'unlinkDir'] // , 'raw'

const cb = (w, path, stats) => {
  console.log(`${w}: ${path}`)
  if (stats) { console.log('stats:', stats) }
}

evs.forEach((x) => watcher.on(x, cb.bind(null, x)))

const options = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 5984,
  protocol: process.env.PROTOCOL || 'http',
  database: process.env.DB
}

if (process.env.USERNAME) {
  options.name = process.env.USERNAME
}

if (process.env.PASSWORD) {
  options.password = process.env.PASSWORD
}

const couchdbEvents = new CouchdbChangeEvents(options)

couchdbEvents.on('data', (data) => {
  console.log('data:', data)
})

couchdbEvents.on('couchdb_status', (status) => {
  console.log('status:', status)
})

couchdbEvents.on('error', (error) => {
  console.log('error:', error)
})

let cnt = 0
setInterval(() => console.log('couchdbEvents:', ++cnt, Object.keys(couchdbEvents).join()), 6000)

