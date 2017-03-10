'use strict'

// core
const fs = require('fs')

// npm
const got = require('got')
const pify = require('pify')
const stringify = require('json-stable-stringify')

const zzzabc = require('./lru')

const zzz = zzzabc.zzz

const md5sum = zzzabc.md5sum

const readBody = zzzabc.readBody

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
      if (a === md5) { return }

      // FIXME: DB URL (process.env...)
      return got.post('http://localhost:5993/flap', { json, headers, body: JSON.stringify(body) })
        .then((x) => {
          body._id = x.body.id
          body._rev = x.body.rev
          const md5 = md5sum(body)
          console.log('md5b:', path, md5)
          lruSet(path, md5)

          return writeFile(path, stringify(body, { space: 2 }))
          // return writeFile(path, JSON.stringify(body, null, '  '))
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
