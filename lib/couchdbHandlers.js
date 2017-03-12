'use strict'

// core
const fs = require('fs')

// npm
const pify = require('pify')
const stringify = require('json-stable-stringify')

// self
const zzzabc = require('./lru')

const zzz = zzzabc.zzz

const md5sum = zzzabc.md5sum

const readBody = zzzabc.readBody

const lruX = zzz()
const lruGet = lruX.lruGet
const lruSet = lruX.lruSet

const writeFile = pify(fs.writeFile)

const status = (status) => {
  console.log('\nstatus:', status)
}

const doData = (d) => {
  console.log('\ndata.seq:', d.seq, d.id, d.changes[0].rev)
  if (d.deleted) {
    console.log('would delete...')
    return
  }

  if (!d.doc) {
    console.log('no doc...')
    return
  }

  if (d.doc.type !== 'ressources') {
    console.log('type not "ressources":', d.doc.type)
    return
  }

  if (d.doc['sous-type'] !== 'pers') {
    console.log('sous-type not "pers":', d.doc['sous-type'])
    return
  }
  console.log('DO IT!')
  const md5 = md5sum(d.doc)
  console.log('md5:', md5)
  const p = '/home/millette/wal/data2/personnes/' + d.id + '.json'
  lruGet(p)
    .then((x) => {
      // console.log('x:', x)
      if (x !== md5) {
        lruSet(p, md5)
        return writeFile(p, stringify(d.doc, { space: 2 }))
      }
    })
    .catch((e) => {
      // console.log('No file found...', e, p, md5)
      lruSet(p, md5)
      return writeFile(p, stringify(d.doc, { space: 2 }))
    })
}

const anError = (error) => {
  console.error('\nerror:', error)
}

module.exports = {
  couchdb_status: status,
  data: doData,
  couchdb_error: anError
}
