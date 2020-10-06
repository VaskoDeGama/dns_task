const ip6addr = require('ip6addr')
const udp = require('dgram')

const RESOLVE_TIMEOUT = 2000

const TYPE_A = 1
const TYPE_AAAA = 28

const QR_QUERY = 0
const QR_RESPONSE = 1

const RCODE_OK = 0
const RCODE_NXDOMAIN = 3

const OPCODE_QUERY = 0
const RECURSION_DESIRED = 1

const messages = new Map()
let resolveServerAddress = null

const prepareDomainNameFiled = (addr) => {
  const parsedAddress = addr.split('.').map(item => {
    const buf = Buffer.alloc(1, item.length, 'hex')

    return Buffer.concat([buf, Buffer.from(item)])
  })

  parsedAddress.push(Buffer.alloc(1, 0, 'hex'))

  return Buffer.concat(parsedAddress)
}

const generateReq = (address) => {
  const reqId = Buffer.alloc(2)
  const flags = Buffer.alloc(2)
  const queryCount = Buffer.alloc(2)
  const rss = Buffer.alloc(6, 0)
  const type = Buffer.alloc(2)
  const classIn = Buffer.alloc(2)

  const id = (Math.floor(Math.random() * ((1000 - 2) + 1))).toString(16).padStart(4, '0')
  const flagStr = (QR_QUERY.toString(2) + OPCODE_QUERY.toString(2).padStart(4, '0') + RECURSION_DESIRED.toString(2) + '00')
  const [byteOne, byteTwo] = flagStr.match(/.{4}/g)

  const query = prepareDomainNameFiled(address)

  flags.write(byteOne, 1, 'hex')
  flags.write(byteTwo, 0, 'hex')
  reqId.write(id, 'hex')
  queryCount.writeIntLE(1, 1, 1)
  type.writeIntLE(TYPE_A, 1, 1)
  classIn.writeIntLE(1, 1, 1)

  const request = Buffer.concat([reqId, flags, queryCount, rss, query, type, classIn])

  return {
    msg: request,
    id,
    reqLength: request.length
  }
}

const getResponseId = (res) => {
  return res.slice(0, 2).toString('hex')
}

const decodeRes = (res, reqLength) => {
  const result = []

  const answersCount = res.readInt16BE(6)

  if (answersCount > 0) {
    const answers = res.slice(reqLength, res.length)
    const oneAnswerLength = answers.length / answersCount

    for (let i = 0; i < answersCount; i++) {
      const answer = answers.slice(i * oneAnswerLength, (i + 1) * oneAnswerLength)
      const addrBuffer = answer.slice(oneAnswerLength - 4, oneAnswerLength)

      result.push([...addrBuffer.values()].join('.'))
    }
  }

  return result.sort()
}

const resolve4 = (address, cb) => {
  if (typeof address !== 'string') {
    return cb(new Error('address should be a string'))
  }

  let timeout = null

  const client = udp.createSocket('udp4')

  client.on('error', (err) => cb(err))

  client.on('message', (msg) => {
    clearTimeout(timeout)
    client.close(() => {
      const id = getResponseId(msg)

      if (messages.has(id)) {
        const { callback, reqLength } = messages.get(id)
        const res = decodeRes(msg, reqLength)

        callback(null, res)
      } else {
        cb(new Error('Wrong id'))
      }
    })
  })

  client.on('connect', () => {
    const { msg, id, reqLength } = generateReq(address)

    messages.set(id, {
      callback: cb,
      reqLength
    })
    sendRequest(msg)
  })

  const timer = () => {
    timeout = setTimeout(() => {
      client.close(() => {
        return cb(new Error('Request timed out'))
      })
    }, RESOLVE_TIMEOUT)
  }

  const sendRequest = (req) => {
    client.send(req)
    timer()
  }

  if (resolveServerAddress) {
    const [address, port] = resolveServerAddress.split(':')

    client.connect(port, address, (err) => {
      if (err) {
        cb(err)
      }
    })
  } else {
    cb(new Error('Resolve server Address not set'))
  }
}

const resolve6 = (address, cb) => {
  cb(new Error('Not implemented'))
}

/**
 * Sets which DNS server to contact
 * @param {string} addr - IPv4 address or address with IP:PORT format
 * @return {boolean || string} resolveServerAddress - for tests
 */
const setResolveServer = (addr) => {
  if (typeof addr !== 'string') {
    return false
  }

  if (!addr.includes('.') || addr.length < 7) {
    return false
  }

  if (!addr.includes(':')) {
    addr = addr + ':53'
  }

  resolveServerAddress = addr
  return resolveServerAddress
}

module.exports = {
  resolve4,
  resolve6,
  setResolveServer
}
