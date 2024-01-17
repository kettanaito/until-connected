import http from 'node:http'

export async function createServer(
  port: number,
  host?: string
): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    res.writeHead(200)
    // Intentionally keep any request pending forever.
    // You mustn't make any requests to the application
    // to verify that it's running.
  })

  return new Promise((resolve, reject) => {
    process.on('beforeExit', () => server.close())

    server.listen(port, host, () => resolve(server))
    server.on('error', (error) => reject(error))
  })
}
