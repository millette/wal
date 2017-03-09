'use strict'

// npm
const chokidar = require('chokidar')
const CouchdbChangeEvents = require('couchdb-change-events')

const setupWatcher = (p) => {
  const p1 = [process.cwd(), p, '**', '*.json'].join('/')
  const p2 = [process.cwd(), p, '*.json'].join('/')

  const watcher = chokidar.watch([p1, p2], {
    ignoreInitial: true,
    followSymlinks: false,
    alwaysStat: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  })
  return new Promise((resolve, reject) => {
    const error = (err) => {
      if (err.errno === 'ENOSPC') {
        watcher.close()
        console.error(`Out of inotify space. Increase it with the following command:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

    The change to this config will remain after a reboot.`)
        reject(err)
      }
    }
    watcher.once('ready', () => {
      watcher.removeListener('error', error)
      resolve(watcher)
    })
    watcher.once('error', error)
  })
}

const setupCouch = (watcher) => {
  const options = {
    // lastEventId: 'abcd...',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 5984,
    protocol: process.env.PROTOCOL || 'http',
    database: process.env.DB
  }
  if (process.env.USERNAME) { options.name = process.env.USERNAME }
  if (process.env.PASSWORD) { options.password = process.env.PASSWORD }
  const couchdbEvents = new CouchdbChangeEvents(options)
  return new Promise((resolve, reject) => {
    // let timer
    const datas = []
    const ready = (status) => {
      if (status === 'connected') {
        couchdbEvents.removeListener('couchdb_error', reject)
        couchdbEvents.removeListener('couchdb_status', ready)
        // clearTimeout(timer)
        return resolve({ dataQueue, datas, watcher, couchdbEvents })
      }
      if (status === 'disconnected') {
        couchdbEvents.removeListener('couchdb_status', ready)
        couchdbEvents.removeListener('couchdb_error', reject)
        // clearTimeout(timer)
        return reject(new Error('Disconnected at start.'))
      }
      console.error('unexpected status:', status)
    }
    const dataQueue = (data) => datas.push(data)
    couchdbEvents.on('data', dataQueue)
    couchdbEvents.on('couchdb_status', ready)
    couchdbEvents.once('couchdb_error', reject)
    /*
    timer = setTimeout(() => {
      couchdbEvents.removeListener('couchdb_error', reject)
      couchdbEvents.removeListener('couchdb_status', ready)
      reject(new Error('Connect timeout.'))
    }, 20000)
    */
  })
}

exports.setupWatcher = setupWatcher
exports.setupCouch = setupCouch
