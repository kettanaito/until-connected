import { untilConnected } from '../src/index.js'
import { createServer } from './utils.js'

it('resolves immediately for already open connection', async () => {
  await createServer(56780)
  await expect(untilConnected({ target: 56780 })).resolves.toBeUndefined()
})

it('resolves when the connection gets open', async () => {
  const connectionPromise = untilConnected({ target: 56781 })
  createServer(56781)
  await expect(connectionPromise).resolves.toBeUndefined()
})

it('resolves if the connection opens within the timeout', async () => {
  const connectionPromise = untilConnected({
    target: 56782,
    maxRetries: 5,
    connectionInterval: 100,
  })
  setTimeout(() => createServer(56782), 400)
  await expect(connectionPromise).resolves.toBeUndefined()
})

it('rejects if the connection fails to open within the timeout', async () => {
  const errorPromise = untilConnected({
    target: 56783,
    connectionInterval: 100,
  })
    .then(() => {
      throw new Error('Must never resolve')
    })
    .catch<Error>((error) => error)

  setTimeout(() => createServer(56783), 600)

  const error = await errorPromise
  expect(error.message).toBe(
    `Failed to await connection at :56783. Connection never established (retries: 5).`
  )
  expect(error.cause).toEqual(new Error('connect ECONNREFUSED ::1:56783'))
})

it('rejects if the connection fails to open after max retries', async () => {
  const error = await untilConnected({ target: 3000 })
    .then(() => {
      throw new Error('Must never resolve')
    })
    .catch<Error>((error) => error)

  expect(error.message).toBe(
    'Failed to await connection at :3000. Connection never established (retries: 5).'
  )
  expect(error.cause).toEqual(new Error('connect ECONNREFUSED ::1:3000'))
})
