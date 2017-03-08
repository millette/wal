'use strict'

const chokidar = require('chokidar')

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
