const express = require('express')
const app = express()
const appBroker = require('./app_broker_client')

app.get('/', function (req, res) {
  res.send('Hello Node!')
})

const parameters = {
  messageTypeId: "75d93472-4b81-46f1-848c-bfa8bf6de881",
  iteratorType:  'EARLIEST',
  maxBatchSize:  10
}

var lastIterator = null

app.get('/messages', async function (req, res) {
  try {
    if(lastIterator == null) {
      const shards = await(appBroker.getShards(parameters))
      // Consume only first shard
      lastIterator = await(appBroker.getIterator(parameters, shards[0].shardId))
    }

    // Get messages
    const messages = await(appBroker.getMessages(parameters, lastIterator))
    lastIterator = messages.nextIterator

    res.send(JSON.stringify(messages))
  } catch(err) {
    console.error(err.message)
    res.send(`Error calling app-broker: ${err.message}`)
  }
})

app.listen(80, function () {
  console.log('Example app listening on port 80!')
})
