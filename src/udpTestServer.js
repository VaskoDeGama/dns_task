const udp = require('dgram')

const Mock = {
  'googl.com.': {
    'ipv4': '8180000100060000000005676f6f676c03636f6d0000010001c00c000100010000012b000440e9a16ac00c000100010000012b000440e9a167c00c000100010000012b000440e9a193c00c000100010000012b000440e9a169c00c000100010000012b000440e9a163c00c000100010000012b000440e9a168',
    'ipv6': '8180000100040000000005676f6f676c03636f6d00001c0001c00c001c00010000012b00102a00145040100c010000000000000068c00c001c00010000012b00102a00145040100c010000000000000069c00c001c00010000012b00102a00145040100c010000000000000067c00c001c00010000012b00102a00145040100c010000000000000063'
  },
  'google.com.': {
    'ipv4': '8180000100060000000006676f6f676c6503636f6d0000010001c00c00010001000000c80004adc2de71c00c00010001000000c80004adc2de8ac00c00010001000000c80004adc2de66c00c00010001000000c80004adc2de8bc00c00010001000000c80004adc2de65c00c00010001000000c80004adc2de64',
    'ipv6': '8180000100040000000006676f6f676c6503636f6d00001c0001c00c001c00010000012b00102a00145040100c090000000000000066c00c001c00010000012b00102a00145040100c090000000000000071c00c001c00010000012b00102a00145040100c09000000000000008ac00c001c00010000012b00102a00145040100c090000000000000064'
  },
  'mail.google.mail.google.com.': {
    'ipv4': '81830001000000010000046d61696c06676f6f676c65046d61696c06676f6f676c6503636f6d0000010001c01d000600010000003b0026036e7331c01d09646e732d61646d696ec01d1400e45b0000038400000384000007080000003c',
    'ipv6': '81830001000000010000046d61696c06676f6f676c65046d61696c06676f6f676c6503636f6d00001c0001c01d000600010000003b0026036e7331c01d09646e732d61646d696ec01d1400e45b0000038400000384000007080000003c'
  },
  'ru.net.co.net.dot.hex.': {
    'ipv4': '81830001000000010000027275036e657402636f036e657403646f7403686578000001000100000600010001517e004001610c726f6f742d73657276657273036e657400056e73746c640c766572697369676e2d67727303636f6d0078684a5c000007080000038400093a8000015180',
    'ipv6': '81830001000000010000027275036e657402636f036e657403646f740368657800001c000100000600010001517e004001610c726f6f742d73657276657273036e657400056e73746c640c766572697369676e2d67727303636f6d0078684a5c000007080000038400093a8000015180'
  }
}

const getResponseId = (res) => {
  return res.slice(0, 2)
}
const getDomainName = (res) => {
  const result = []
  let domainHex = res.slice(12, res.length - 4).toString('hex')

  while (domainHex.length > 0) {
    const wordLength = (parseInt(domainHex.slice(0, 2), 16) * 2)
    const wordHex = domainHex.slice(2, 2 + wordLength)
    const domain = Buffer.from(wordHex, 'hex').toString()

    result.push(domain)
    domainHex = domainHex.slice(wordLength + 2)
  }

  return result.join('.')
}

const getRequestType = (msg) => {
  const hex = msg.slice(msg.length - 4, msg.length - 2).toString('hex')

  return hex === '0001' ? 'ipv4' : 'ipv6'
}

const generateResponse = (msg) => {
  const domain = getDomainName(msg)

  const id = getResponseId(msg)

  const type = getRequestType(msg)

  if (!Mock[domain]) {
    return msg
  }

  return Buffer.concat([id, Buffer.from(Mock[domain][type], 'hex')])
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

        this.server.send(generateResponse(msg), port, address)
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
