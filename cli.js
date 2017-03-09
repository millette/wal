'use strict'

// npm
require('dotenv-safe').load({ allowEmptyValues: true })
if (!process.env.DB) {
  console.error('Required env variable: DB.')
  process.exit(1)
}

// self
const wal = require('.')

const doData = (d) => {
  console.log('\ndata:', d)
}

const processQueue = (x) => {
  x.couchdbEvents.on('data', doData)
  x.couchdbEvents.removeListener('data', x.dataQueue)
  x.datas.forEach(doData)
  delete x.datas
  delete x.dataQueue
  return x
}

const goOn = (x) => {
  console.log('go on...')
  const watcher = x.watcher
  const couchdbEvents = x.couchdbEvents

  watcher.on('error', (error) => {
    console.error('\nerror:', error)
  })

  watcher.on('add', (path, stats) => {
    console.log(`\nadd ${path}`, stats)
  })

  watcher.on('change', (path, stats) => {
    console.log(`\nchange ${path}`, stats)
  })

  watcher.on('unlink', (path) => {
    console.log(`\nunlink ${path}`)
  })

  couchdbEvents.on('couchdb_status', (status) => {
    console.log('\nstatus:', status)
  })

  couchdbEvents.on('error', (error) => {
    console.error('\nerror:', error)
  })

  return processQueue(x)
}

wal.setupWatcher('data/**/*.json')
  .then(wal.setupCouch)
  .then(goOn)
  .then((x) => {
    console.log(Object.keys(x))
    const watcher = x.watcher
    const couchdbEvents = x.couchdbEvents
    const watcherNames = watcher.eventNames()
    const couchdbEventsNames = couchdbEvents.eventNames()
    console.log(watcherNames)
    console.log(couchdbEventsNames)

    watcherNames.forEach((name) => {
      console.log(name, watcher.listeners(name).length)
    })

    couchdbEventsNames.forEach((name) => {
      console.log(name, couchdbEvents.listeners(name).length)
    })
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
