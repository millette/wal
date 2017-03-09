'use strict'

// core
const basename = require('path').basename
const fs = require('fs')
const crypto = require('crypto')
const omit = require('lodash.omit')

// npm
const got = require('got')
const pify = require('pify')
const stringify = require('json-stable-stringify')
const AsyncLru = require('async-lru')

const readBody = (path) => {
  try {
    const body = require(path)
    if (!body._id) { body._id = basename(path, '.json') }
    return body
  } catch (e) {
    console.error(e)
    return e
  }
}

const md5sum = (body) => {
  if (!body._rev) { return '' }
  const z = stringify(omit(body, ['_id', '_rev']), { space: 2 })
  // const z = stringify(body, { space: 2 })
  const hash = crypto.createHash('md5')
  hash.update(z)
  return hash.digest('hex')
}

const zzz = () => {
  const lru = new AsyncLru({
    max: 100 * 1000,
    load: (path, cb) => {
      const body = readBody(path)
      // console.log(typeof body, Object.keys(body), body instanceof Error)
      if (body instanceof Error) { return cb(body) }
      const md5 = md5sum(body)
      console.log('md5a:', path, md5)
      cb(null, md5)
    }
  })

  return {
    lruGet: pify(lru.get.bind(lru)),
    lruSet: lru.set.bind(lru)
  }
}

const writeFile = pify(fs.writeFile)

const lruX = zzz()
const lruGet = lruX.lruGet
const lruSet = lruX.lruSet

const addOrChange = (path, stats) => {
  const body = readBody(path)
  if (body instanceof Error) { return body }

  const json = true
  const headers = { 'content-type': 'application/json' }

  lruGet(path)
    .then((a) => {
      const md5 = md5sum(body)
      console.log('md5c:', path, md5)
      if (a && a === md5) { return }

      // FIXME: DB URL (process.env...)
      return got.post('http://localhost:5993/flap', { json, headers, body: JSON.stringify(body) })
        .then((x) => {
          body._id = x.body.id
          body._rev = x.body.rev
          const md5 = md5sum(body)
          console.log('md5b:', path, md5)
          lruSet(path, md5)
          return writeFile(path, JSON.stringify(body, null, '  '))
            // .then(() => lruSet(path, md5))
        })
    })
    .then(() => body)
    .catch(console.error)
}

const add = (path, stats) => {
  console.log(`\nadd ${path}`) // , stats
  addOrChange(path, stats)
}

const change = (path, stats) => {
  console.log(`\nchange ${path}`) // , stats
  addOrChange(path, stats)
}

const anError = (error) => {
  console.error('\nerror:', error)
}

const unlink = (path) => {
  console.log(`\nunlink ${path}`)
}

module.exports = {
  add,
  change,
  error: anError,
  unlink
}
