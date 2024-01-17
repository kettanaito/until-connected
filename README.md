# Until Connected

Wait for a connection at the given target without making any requests.

## Why this package?

Most packages that concerns themselves with awaiting a particular connection do so by making a `HEAD`/`GET` request to the address. This means that if you are awaiting an application that _has some lgic_ in its root (`/`) route, such an await mechanism will trigger that logic.

Consider this:

```js
// app.js
import express from 'express'

const app = express()

app.get('/', async (req, res) => {
  const response = await fetch('https://example.com')
  res.json(await response.json())
})

app.listen(3000)
```

To serve the root route, this application does an additional request to `https://example.com`. Now, if you try to await `127.0.0.1:3000` by conventional methods, any ping requests to `/` will also trigger the `GET https://example.com`.

This problem quickly becomes apparent if you wish to await a JavaScript application before testing it. If your application needs third-party resources to render its root route, awaiting it by conentional methods will force those resources to be fetched. This is highly undesirable.

This module solves this problem by relying on establishing a socket connection (using `net.connect()` from Node.js) to verify the application is running instead of making any requests to it. This way, it doesn't trigger any requests in your application while allowing you to reliably wait until it's up and running.

## Usage

```sh
npm i until-connected
```

```js
import { exec } from 'node:child_process'
import { untilConnected } from 'until-connected'

async function runServerThenTest(runCommand, url, testCommand) {
  // Start the application server.
  exec(runCommand)

  // Wait for the application server to be running.
  await untilConnected({ target: url })

  // Run the tests.
  exec(testCommand)
}
```

## API

### `untilConnected(options)`

Returns a Promise that resolves if the connection was successful and rejects if it wasn't, given additional options.

```js
// Wait for the application on port 3000.
await untilConnected({ target: 3000 })
```

The returned Promise rejects if the connection couldn't be established or if it fails for any other reason. The original connection error is exposed under `error.cause` on the Promise:

```js
untilConnected({ target: 3000 }).catch((error) => {
  console.log('Original connection error:', error.cause)
})
```

## Options

### `target`

- _Required_. `number | string | URL`

A target to await. Supports a standalone port number and a full URL string or a `URL` instance.

```js
// Wait for the application on port 3000.
await untilConnected({
  target: 3000,
})

// Wait for the application at the address.
await untilConnected({
  target: 'http://localhost:56789',
})
```

### `maxRetries`

- `number` (default: 5)

Maximum number of retries before rejecting the connection Promise.

```js
await untilConnected({
  port: 3000,
  // By using 1, the wait function will reject
  // if the connection fails after the first attempt.
  maxRetries: 1,
})
```

### `connectionInterval`

- `number` (in ms)

An interval between connection retries.

```js
await untilConnected({
  target: 3000,
  // Wait for 500ms after a failed connection
  // before attempting another connection.
  connectionInterval: 500,
})
```

## License

MIT.
