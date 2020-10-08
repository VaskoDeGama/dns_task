const udp = require('dgram')

const RESOLVE_TIMEOUT = 2000

const TYPE_A = 1
const TYPE_AAAA = 28
const QR_QUERY = 0
const OPCODE_QUERY = 0
const RECURSION_DESIRED = 1

class DNSClient {
  /**
   * DNSClient constructor
   * @param {number} dnsPort
   * @param {str} dnsAddress
   * @param {function} resultCb
   * @param {number} type
   */
  constructor (dnsPort, dnsAddress, resultCb, type) {
    this.client = null
    this.port = dnsPort
    this.address = dnsAddress
    this.messages = new Map()
    this.resultCb = resultCb
    this.timeout = null
    this.type = type

    this.init()
  }

  /**
   * Initialize client
   */
  init () {
    if (!this.client) {
      this.client = udp.createSocket('udp4')
      this.client.on('error', (err) => this.resultCb(err))
    }
  }

  /**
   * Request ip by type from dns server
   * @param {string} searchAddress - needed domain
   */
  search (searchAddress) {
    this.client.on('message', (msg) => {
      const id = this.getResponseId(msg)

      if (this.messages.has(id) && this.itDns(msg)) {
        clearTimeout(this.timeout)

        const { callback, reqLength, domainName } = this.messages.get(id)
        const res = this.decodeRes(msg, reqLength, domainName, this.type)

        this.client.close(() => {
          callback(null, res)
        })
      }
    })

    this.client.on('connect', () => {
      const { msg, id, reqLength, domainName } = this.generateReq(searchAddress, this.type)

      this.messages.set(id, {
        callback: this.resultCb,
        reqLength,
        domainName
      })
      this.sendRequest(msg)
    })

    this.client.connect(this.port, this.address)
  }

  /**
   * Send request and start timer
   * @param {Buffer} msg - request message
   */
  sendRequest (msg) {
    this.client.send(msg)
    this.timer()
  }

  /**
   * Start timer
   */
  timer () {
    this.timeout = setTimeout(() => {
      this.client.close(() => {
        return this.resultCb(new Error('Request timed out'))
      })
    }, RESOLVE_TIMEOUT)
  }

  /**
   * Prepare buffered Domain Name Filed
   * for 'ns.itep.ru' should be '2ns4itep2ru0'
   * @param  {string} address - symbolic domain name
   * @return {Buffer} - contains  Domain Name Filed for query
   */
  prepareDomainNameFiled (address) {
    let domainNameField = Buffer.alloc(0)
    const domainsArray = address.split('.')

    domainsArray.forEach(item => {
      const fieldLength = Buffer.alloc(1, item.length, 'hex')
      const field = Buffer.from(item)

      domainNameField = Buffer.concat([domainNameField, fieldLength, field])
    })

    return domainNameField
  }

  /**
   * Code offset for message compression
   * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
   * | 1  1|                OFFSET                   |
   * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
   * @param {Buffer} buffer - message for compression
   * @param {Buffer} bufferedDomain buffered domain name
   * @return {Buffer} - buffered offset
   */
  codeOffsetLink (buffer, bufferedDomain) {
    const offset = parseInt(buffer.indexOf(bufferedDomain).toString(2).padStart(14, '0').padStart(16, '1'), 2).toString(16)

    return Buffer.from(offset, 'hex')
  }

  /**
   * Decode offset for message compression
   * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
   * | 1  1|                OFFSET                   |
   * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
   * @param {Buffer} offsetLink - offsetLnk for decode
   * @return {number} - domain offset in message
   */
  decodeOffsetLink (offsetLink) {
    return parseInt(parseInt(offsetLink.toString('hex'), 16).toString(2).slice(2), 2)
  }

  /**
   * Request object
   * @typedef {Object} requestObject
   * @property {Buffer} msg - buffer of the request that is sent to the dns server
   * @property {string} id - request Id for handling response
   * @property {number} reqLength - request buffer length for parsing response
   * @property {Buffer} domainName - buffered Domain Name Filed
   */

  /**
   * Generate request buffer, request id and request length
   * @param  {string} address - symbolic domain name
   * @param {number} reqType - A or AAAA
   * @return {requestObject}
   */
  generateReq (address, reqType) {
    const reqId = Buffer.alloc(2)
    const flags = Buffer.alloc(2)
    const queryCount = Buffer.alloc(2)
    const rss = Buffer.alloc(6, 0)
    const type = Buffer.alloc(2)
    const classIn = Buffer.alloc(2)

    const id = (Math.floor(Math.random() * ((1000 - 2) + 1))).toString(16).padStart(4, '0')
    const flagStr = (QR_QUERY.toString(2) + OPCODE_QUERY.toString(2).padStart(4, '0') + RECURSION_DESIRED.toString(2) + '00')

    const [byteOne, byteTwo] = flagStr.match(/.{4}/g)

    const query = this.prepareDomainNameFiled(address)

    flags.write(byteOne, 1, 'hex')
    flags.write(byteTwo, 0, 'hex')
    reqId.write(id, 'hex')
    queryCount.writeIntLE(1, 1, 1)
    type.writeIntLE(reqType, 1, 1)
    classIn.writeIntLE(1, 1, 1)

    const request = Buffer.concat([reqId, flags, queryCount, rss, query, type, classIn])

    return {
      msg: request,
      id,
      reqLength: request.length,
      domainName: query
    }
  }

  /**
   * Get response id from response buffer
   * @param {Buffer} res - response buffer received from dns server
   * @return {string} - request Id
   */
  getResponseId (res) {
    return res.slice(0, 2).toString('hex')
  }

  /**
   * Check the message that it was received from dns
   * @param {Buffer} res - received message
   * @return {boolean}
   */
  itDns (res) {
    return res.slice(2, 3).equals(Buffer.from('81', 'hex'))
  }

  /**
   * Answer object
   * @typedef {Object} answerObject
   * @property {number} nameOffset - buffer 'c0 0c' where 0c it hex offset on Domain name in request
   * @property {number} type - record type A === 1 or AAAA === 28
   * @property {number} dataLength - ip data  length
   * @property {string} ip - buffered ip data
   */

  /**
   * Parse data from answer buffer
   * @param  {Buffer} answer - part of dns response buffer
   * @return {answerObject}
   */
  parseAnswer (answer) {
    const nameOffset = this.decodeOffsetLink(answer.slice(0, 2))
    const type = answer.readUInt16BE(2)
    const dataLength = answer.readUInt16BE(10)
    const ip = this.decodeIp(answer.slice(12, 12 + dataLength), type)

    return {
      nameOffset,
      type,
      dataLength,
      ip
    }
  }

  /**
   * Trim leading zero from hexed number
   * @param {string} str - string with leading zero
   * @return {string} - string  with out leading zero
   */
  trimLeadingZero (str) {
    const array = [...str]

    for (let i = 0; i < array.length - 1; i += 1) {
      if (array[i] === '0') {
        array[i] = ''
      } else {
        break
      }
    }

    return array.join('')
  }

  /**
   * Decode ipv4 and ipv6
   * @param {Buffer} rawData
   * @param type
   * @return {string|*}
   */
  decodeIp (rawData, type) {
    if (type === TYPE_A) {
      const str = rawData.toString('hex')
      const ipv4 = []

      for (let i = 0; i < str.length; i += 2) {
        const octet = str.slice(i, i + 2)
        const num = parseInt(octet, 16)

        ipv4.push(num)
      }

      return ipv4.join('.')
    }

    if (type === TYPE_AAAA) {
      const ipv6 = []
      const str = rawData.toString('hex')

      for (let i = 0; i < str.length; i += 4) {
        const hextet = str.slice(i, i + 4)

        const zeroHextet = this.trimLeadingZero(hextet)

        ipv6.push(zeroHextet)

        if (i + 4 !== str.length) {
          ipv6.push(':')
        }
      }

      return ipv6.join('')
    }

    return rawData
  }

  /**
   * Decoding response buffer received from dns server
   * @param {Buffer} res - response buffer received from dns server
   * @param {number} reqLength - request length for this response
   * @param {Buffer} domainName - buffered Domain Name Filed
   * @param {number} type - requested type
   * @return {string[]} - array of address ipv4 or empty array if nothing received
   */
  decodeRes (res, reqLength, domainName, type) {
    const temp = []

    const answersCount = res.readUInt16BE(6)
    const linkOnNeededDomain = this.codeOffsetLink(res, domainName)

    if (answersCount > 0) {
      let answers = res.slice(reqLength, res.length)

      while (answers.length > 0 && answers.includes(linkOnNeededDomain)) {
        const answerStart = answers.indexOf(linkOnNeededDomain)

        answers = answers.slice(answerStart, answers.length)

        const answer = this.parseAnswer(answers)

        answers = answers.slice(answer.dataLength + 12, answers.length)

        if (answer.type === type) {
          temp.push(answer.ip)
        }
      }
    }

    return temp.sort()
  }
}

module.exports = DNSClient
