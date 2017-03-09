'use strict'

// npm
require('dotenv-safe').load({ allowEmptyValues: true })
if (!process.env.DB) {
  console.error('Required env variable: DB.')
  process.exit(1)
}

const diff = require('lodash.difference')

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

const verify = (x) => {
  const an = x.watcher.eventNames().sort()
  const bn = x.couchdbEvents.eventNames().sort()
  const ae = ['add', 'change', 'error', 'unlink']
  const be = ['couchdb_status', 'data', 'error']
  const extraA = diff(an, ae)
  const extraB = diff(bn, be)
  const missingA = diff(ae, an)
  const missingB = diff(be, bn)
  const a = an.filter((name) => x.watcher.listeners(name).length !== 1)
  const b = bn.filter((name) => x.couchdbEvents.listeners(name).length !== 1)

  if (a.length || b.length || extraA.length || extraB.length || missingA.length || missingB.length) {
    const err = new Error('Wrong listener config.')
    err.data = {}
    if (a.length) { err.data.watcher = a }
    if (extraA.length) { err.data.watcherExtra = extraA }
    if (missingA.length) { err.data.watcherMissing = missingA }
    if (b.length) { err.data.couchdbEvents = b }
    if (extraB.length) { err.data.couchdbEventsExtra = extraB }
    if (missingB.length) { err.data.couchdbEventsMissing = missingB }
    return Promise.reject(err)
  }
  return x
}

wal.setupWatcher('data/**/*.json')
  .then(wal.setupCouch)
  .then(goOn)
  .then(verify)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
