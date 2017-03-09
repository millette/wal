'use strict'

const watcher = require('./fileHandlers')
const couchdbEvents = require('./couchdbHandlers')

module.exports = { couchdbEvents, watcher }
