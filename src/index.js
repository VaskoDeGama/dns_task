// const { resolve4, resolve6, setResolveServer } = require('./dns')
const udp = require('dgram')

const getResponseId = (res) => {
  return res.slice(0, 2)
}

const udpServer = (port, address) => {
  const server = udp.createSocket('udp4')

  server.on('error', (err) => {
    console.log('Error:', err)
  })
  server.on('message', (msg, rinfo) => {
    console.log(msg)
    server.send('msg', rinfo.port, rinfo.address)

    const message = Buffer.from('818000010006000000000377777706676f6f676c6503636f6d0000010001c00c00010001000001230004adc2496ac00c00010001000001230004adc24969c00c00010001000001230004adc24993c00c00010001000001230004adc24963c00c00010001000001230004adc24967c00c00010001000001230004adc24968', 'hex')
    const response = Buffer.concat([getResponseId(msg), message])

    server.send(response, rinfo.port, rinfo.address)
  })

  server.on('listening', () => {
    const address = server.address()

    console.log(`server listening ${address.address}:${address.port}`)
  })

  server.bind(port, address)
}

udpServer(1234, '127.0.0.1')
