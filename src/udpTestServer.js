const udp = require('dgram')

const getResponseId = (res) => {
  return res.slice(0, 2)
}

class UdpTestServer {
  constructor (port, address) {
    this.port = port
    this.address = address
    this.server = null

    this.init()
  }

  init () {
    if (!this.server) {
      this.server = udp.createSocket('udp4')
      this.server.on('error', (err) => {
        console.log('Error:', err)
      })
      this.server.on('message', (msg, rinfo) => {
        const { address, port } = rinfo

        this.server.send('msg', port, address)

        const message = Buffer.from('818000010006000000000377777706676f6f676c6503636f6d0000010001c00c00010001000001230004adc2496ac00c00010001000001230004adc24969c00c00010001000001230004adc24993c00c00010001000001230004adc24963c00c00010001000001230004adc24967c00c00010001000001230004adc24968', 'hex')
        const response = Buffer.concat([getResponseId(msg), message])

        this.server.send(response, port, address)
      })
      this.server.on('listening', () => {
        const address = this.server.address()

        console.log(`server listening ${address.address}:${address.port}`)
      })
    }
  }

  start () {
    this.server.bind(this.port, this.address)
  }

  stop () {
    this.server.close()
  }
}

module.exports = UdpTestServer
