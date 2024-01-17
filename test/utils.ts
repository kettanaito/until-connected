import http from 'node:http'

export async function createServer(
  port: number,
  host?: string
): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    res.statusCode = 405
    res.end()
  })

  return new Promise((resolve, reject) => {
    process.on('beforeExit', () => server.close())

    server.listen(port, host, () => resolve(server))
    server.on('error', (error) => reject(error))
  })
}
