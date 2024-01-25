import net from 'node:net'

export type Options = {
  /**
   * A target to establish connection to.
   * Supported targets are:
   * - A standalone port number;
   * - A full URL.
   */
  target: number | string | URL

  /**
   * A maximum number of connection retries
   * before rejecting the connection Promise.
   */
  maxRetries?: number

  /**
   * An interval duration (in ms) before retrying
   * the connection.
   */
  connectionInterval?: number
}

/**
 * Returns a Promise that resolves if the connection to the
 * given target was established. The returned Promise will
 * reject if the connection failed to establish, taking the
 * `maxRetries` and `connectionInterval` options into account.
 *
 * @example
 * // Wait until the server is running at port 3000.
 * untilConnected({ target: 3000 })
 *
 * // Wait until the server is running at the address.
 * untilConnected({ target: 'http://127.0.0.1:56789' })
 *
 * // Control the maximum number of retries before rejecting.
 * // When using 1, this will reject if the server isn't already running.
 * untilConnected({ target: 3000, maxRetries: 1 })
 */
export async function untilConnected(options: Options): Promise<void> {
  const { port, host } = resolveConnectionOptions(options)
  const maxRetries = options.maxRetries || 5

  let connectionError: Error | undefined

  for (let retry = 0; retry < maxRetries; retry++) {
    if (retry && 'connectionInterval' in options) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, options.connectionInterval)
      )
    }
    try {
      return await connect(port, host)
    } catch (error) {
      connectionError = error as Error
    }
  }

  throw new Error(
    `Failed to await connection at ${
      host || ''
    }:${port}. Connection never established (retries: ${maxRetries}).`,
    { cause: connectionError }
  )
}

function resolveConnectionOptions(options: Options): {
  port: number
  host: string | undefined
} {
  if (typeof options.target === 'number') {
    return {
      port: options.target,
      host: undefined,
    }
  }

  if (URL.canParse(options.target)) {
    const url = new URL(options.target)

    return {
      port: +url.port,
      host: url.host,
    }
  }

  throw new Error('Invalid "target" option')
}

function connect(port: number, host?: string, timeout?: number) {
  const socket = net.connect({ port, host, timeout })

  return new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve())
    socket.on('timeout', () =>
      reject(new Error(`'Connection at ${host || ''}:${port} timed out'`))
    )
    socket.on('error', (error) => reject(error))
  })
}
