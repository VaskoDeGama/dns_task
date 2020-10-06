// const { resolve4, resolve6, setResolveServer } = require('./dns')
const udp = require('dgram')

const udpServer = (port, address) => {
  const server = udp.createSocket('udp4')

  server.on('error', (err) => {
    console.log('Error:', err)
  })
  server.on('message', (msg, rinfo) => {
    console.log('Message:', msg)
    server.send(msg, rinfo.port, rinfo.address)
  })

  server.on('listening', () => {
    const address = server.address()

    console.log(`server listening ${address.address}:${address.port}`)
  })

  server.bind(port, address)
}

udpServer(8080, 'localhost')
