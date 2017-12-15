const axios = require('axios')
const sleep = require('sleep')
const base64 = require('base-64')

const appId = process.env["GEENY_APPLICATION_ID"]
const host  = process.env["GEENY_APPLICATION_BROKER_SUBSCRIBER_URL"]
const token = process.env["GEENY_APPLICATION_AUTH_TOKEN"]

function log(msg) {
  console.log(msg);
}

async function request(method, url, data) {
  try {
    const response = await axios.request({
      method: method,
      url: url,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
      },
      data: data
    })
    return response.data
  } catch (err) { throw err }
}

module.exports = {
  getShards: async function (parameters) {
    try {
      const url = `${host}/${appId}/messageType/${parameters.messageTypeId}`
      const response = await request('get', url)
      return response.shards
    } catch (err) { throw err }
  },

  getIterator: async function (parameters, shardId) {
    try {
      const data = {
        shardId: shardId,
        iteratorType: parameters.iteratorType,
        maxBatchSize: parameters.maxBatchSize
      }

      const url = `${host}/${appId}/messageType/${parameters.messageTypeId}/iterator`
      const iterator = await request('post', url, data)

      return iterator.shardIterator
    } catch (err) {
      log(`Error in getIterator, ERROR: ${err.message}`)
      throw err
    }
  },

  getMessages: async function (parameters, iterator) {
    try {
      const url = `${host}/${appId}/messageType/${parameters.messageTypeId}/iterator/${iterator}`
      const data = await request('get', url)

      if (data.messages.length > 0) {
	let parsedMessages = data.messages.map(function (message) {
          return {
            userId: message.userId,
            thingId: message.thingId,
            data: base64.decode(message.payload)
          }
	})
	return { nextIterator: data.nextIterator, messages: parsedMessages }
      } else {
	return data
      }
    } catch (err) {
      log(`Error in getIterator: ${err.message}`)
      throw err
    }
  }
}
