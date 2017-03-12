'use strict'

// core
const basename = require('path').basename
// const fs = require('fs')
const crypto = require('crypto')

// npm
const AsyncLru = require('async-lru')
const pify = require('pify')
const stringify = require('json-stable-stringify')
// const omit = require('lodash.omit')

const readBody = (path) => {
  try {
    delete require.cache[require.resolve(path)]
    const body = require(path)
    // console.log('body:', body)
    if (!body._id) { body._id = basename(path, '.json') }
    return body
  } catch (e) {
    // console.error('rha rha', e)
    return e
  }
}

const md5sum = (body) => {
  // if (!body._rev) { return '' }
  // const z = stringify(omit(body, ['_id', '_rev']), { space: 2 })
  const z = stringify(body, { space: 2 })
  const hash = crypto.createHash('md5')
  hash.update(z)
  return hash.digest('hex')
}

let thingy

const zzz = () => {
  if (thingy) { return thingy }
  const lru = new AsyncLru({
    max: 100 * 1000,
    load: (path, cb) => {
      const body = readBody(path)
      if (body instanceof Error) { return cb(body) }
      const md5 = md5sum(body)
      console.log('md5a:', path, md5)
      cb(null, md5)
    }
  })

  thingy = {
    lruGet: pify(lru.get.bind(lru)),
    lruSet: lru.set.bind(lru)
  }
  return thingy
}

module.exports = { zzz, md5sum, readBody }
