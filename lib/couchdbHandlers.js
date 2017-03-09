'use strict'

const status = (status) => {
  console.log('\nstatus:', status)
}

const doData = (d) => {
  console.log('\ndata:', d)
}

const anError = (error) => {
  console.error('\nerror:', error)
}

module.exports = {
  couchdb_status: status,
  data: doData,
  couchdb_error: anError
}
