# Explanation: Step-1 to Step-2

So by now, all we've done is deploy a simple web app to Geeny. In order to
consume IoT sensor data, two steps are necessary.

First: The end-user (i.e., the owner of the device) should grant permission to
the
formula to access the device data. This is commonly known as subscribing.

Second: Once the formula is subscribed to users' devices, you can call the
application broker to get your user's data.

For the time being, we'll ignore the first step. Geeny automatically subscribes
its developers to their devices. This makes prototyping and playing around with
data easier and fun. We'll come back to authentication and authorization in the
next step.

## A Simple Wrapper for the Application Broker API

The Application Broker is the communication bridge between your Formula and the
device data. [Click here to go to the API documentation.](https://docs.geeny.io/api)

We will implement a wrapper for the API using these files:

## `app_broker_client.js`

First, the client imports all the necessary dependencies, including environment
variables necessary for contacting the app-broker service.

```javascript
const axios = require('axios')
const sleep = require('sleep')
const base64 = require('base-64')

const appId = process.env["GEENY_APPLICATION_ID"]
const host = process.env["GEENY_APPLICATION_BROKER_URL"]
const authToken = process.env["GEENY_APPLICATION_AUTH_TOKEN"]
```

Second, we need to configure it so it points to the right Message Type. Message
Types use an identifier that acts as the data schema. This is called
the `messageTypeId`. Each type of data sent or received by a device has one.

By default, we configured the client to use a Garmin Simulator device. This
device transmits Garmin fitness wearable data periodically. You can
configure this `messageTypeId` to use any of the available Message Types on the
Geeny Platform. To find them, go to the [Geeny Data Explorer]
(https://developers.geeny.io/explorer). It's like the yellow pages of
Geeny-compatible device types.

Additionally, you can select the batch size and specify whether you want to
consume either the `EARLIEST` or `LATEST` messages.

```javascript
// Link in the Data Explorer: https://developers.geeny.io/explorer/message-types/75d93472-4b81-46f1-848c-bfa8bf6de881
const brokerConfig = {
  appId:         appId,
  messageTypeId: "75d93472-4b81-46f1-848c-bfa8bf6de881",
  iteratorType:  'EARLIEST', // 'LATEST' is an option too
  maxBatchSize:  10
}
```

## Creating a wrapper for the Application Broker

This is the core of our App Broker client. It wraps the REST API using
asynchronous calls. There's a **shards** call that tells you the number of
partitions in which your data is being sent. An **iterator** call gives you a
"pointer" or "checkpoint" to your data. And finally, a getMessages call
retrieves the messages from a given iterator and the ID of the next iterator.

For more details, you can refer to the [AppBroker API
documentation](https://docs.geeny.io/api/application-broker/).


```javascript
module.exports = {
  getShards: async function () {
    (...)
  },

  getIterator: async function (shardId) {
    (...)
  },

  getMessages: async function (iterator) {
    (...)
  }
}
```

## `app.js`

Now that we have all the tools, we're ready to wire it all up and make a
Formula that demos data consumption.

This snippet does the following:

1. Initializes the iterator if needed.
2. Gets the data of the iterator.
3. Updates the iterator to the new position.
4. Renders the data as JSON in the /messages endpoint of your formula.

```
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
```

Go ahead, deploy the Formula. If you go to  "[your-formula-url]/messages" you
should see some Garmin messages.

```
(Missing data of the succesful run of the example)
```
