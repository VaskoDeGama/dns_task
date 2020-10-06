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

/**
 * Prepare buffered Domain Name Filed
 * for 'ns.itep.ru' should be '2ns4itep2ru0'
 * @param  {string} address - symbolic domain name
 * @return {Buffer} - contains  Domain Name Filed for query
 */
const prepareDomainNameFiled = (address) => {
  const parsedAddress = address.split('.').map(item => {
    const buf = Buffer.alloc(1, item.length, 'hex')

    return Buffer.concat([buf, Buffer.from(item)])
  })

  return Buffer.concat(parsedAddress)
}

/**
 * Request object
 * @type Object
 * @name requestObject
 * @param {Buffer} msg - buffer of the request that is sent to the dns server
 * @param {string} id - request Id for handling response
 * @param {number} reqLength - request buffer length for parsing response
 */

/**
 * Generate request buffer, request id and request length
 * @param  {string} address - symbolic domain name
 * @return {requestObject}
 */
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

/**
 * Get response id from response buffer
 * @param {Buffer} res - response buffer received from dns server
 * @return {string} - request Id
 */
const getResponseId = (res) => {
  return res.slice(0, 2).toString('hex')
}

/**
 * Check the message that it was received from dns
 * @param {Buffer} res - received message
 * @return {boolean}
 */
const itDns = (res) => {
  return res.slice(2, 3).equals(Buffer.from('81', 'hex'))
}

/**
 * Decoding response buffer received from dns server
 * @param {Buffer} res - response buffer received from dns server
 * @param {number} reqLength - request length for this response
 * @return {string[]} - array of address ipv4 or empty array if nothing received
 */
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

/**
 * Send request to dns server and parse response
 * @param {string} address - symbolic domain name
 * @param {function} cb - result callback
 * @return {Error || Array}
 */
const resolve4 = (address, cb) => {
  if (typeof address !== 'string') {
    return cb(new Error('address should be a string'))
  }

  if (address[address.length - 1] !== '.') {
    address += '.'
  }

  let timeout = null

  const client = udp.createSocket('udp4')

  client.on('error', (err) => cb(err))

  client.on('message', (msg) => {
    const id = getResponseId(msg)

    if (messages.has(id) && itDns(msg)) {
      clearTimeout(timeout)

      const { callback, reqLength } = messages.get(id)
      const res = decodeRes(msg, reqLength)

      client.close(() => {
        callback(null, res)
      })
    }
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
 * @param {string} address - IPv4 address or address with IP:PORT format
 * @return {boolean || string} resolveServerAddress - for tests
 */
const setResolveServer = (address) => {
  if (typeof address !== 'string') {
    return false
  }

  if (!address.includes('.') || address.length < 7) {
    return false
  }

  if (!address.includes(':')) {
    address = address + ':53'
  }

  resolveServerAddress = address
  return resolveServerAddress
}

module.exports = {
  resolve4,
  resolve6,
  setResolveServer
}
