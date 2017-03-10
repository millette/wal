'use strict'

// npm
require('dotenv-safe').load({ allowEmptyValues: true })
const diff = require('lodash.difference')

if (!process.env.DB) {
  console.error('Required env variable: DB.')
  process.exit(1)
}

if (!process.env.WATCH) {
  console.error('Required env variable: WATCH.')
  process.exit(1)
}

// self
const wal = require('.')
const handlers = require('./lib/handlers')

/*
const zzzabc = require('./lib/lru')

const zzz = zzzabc.zzz

const lruX = zzz()
const lruGet = lruX.lruGet
const lruSet = lruX.lruSet

lruGet([__dirname, 'data2/amero667.json'].join('/'))
  .then((x) => {
    console.log('x:', x)
    return x
  })
  .then((x) => {
    lruGet([__dirname, 'data2/amero667.json'].join('/'))
      .then((y) => {
        console.log('y:', x)
      })
  })
*/

const setupHandlers = (x) => {
  const watcher = x.watcher
  const couchdbEvents = x.couchdbEvents
  let r
  for (r in handlers.watcher) { watcher.on(r, handlers.watcher[r]) }
  for (r in handlers.couchdbEvents) { couchdbEvents.on(r, handlers.couchdbEvents[r]) }
  couchdbEvents.removeListener('data', x.dataQueue)
  x.datas.forEach(handlers.couchdbEvents.data)
  delete x.datas
  delete x.dataQueue
  return x
}

const verify = (x) => {
  const an = x.watcher.eventNames().sort()
  const bn = x.couchdbEvents.eventNames().sort()
  const ae = ['add', 'change', 'error', 'unlink']
  const be = ['couchdb_status', 'data', 'couchdb_error']
  const extraA = diff(an, ae)
  const extraB = diff(bn, be)
  const missingA = diff(ae, an)
  const missingB = diff(be, bn)
  const a = an.filter((name) => x.watcher.listeners(name).length !== 1)
  const b = bn.filter((name) => x.couchdbEvents.listeners(name).length !== 1)

  if (!a.length && !extraA.length && !missingA.length &&
      !b.length && !extraB.length && !missingB.length) { return x }

  const err = new Error('Wrong listener config.')
  if (a.length) { err.watcher = a }
  if (extraA.length) { err.watcherExtra = extraA }
  if (missingA.length) { err.watcherMissing = missingA }
  if (b.length) { err.couchdbEvents = b }
  if (extraB.length) { err.couchdbEventsExtra = extraB }
  if (missingB.length) { err.couchdbEventsMissing = missingB }
  return Promise.reject(err)
}

wal.setupWatcher(process.env.WATCH)
  .then(wal.setupCouch)
  .then(setupHandlers)
  .then(verify)
  .then((x) => {
    console.log('Awaiting...')
    return x
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
