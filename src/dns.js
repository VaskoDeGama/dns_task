const DNSClient = require('./dnsClient')

const TYPE_A = 1
const TYPE_AAAA = 28

let resolveServerAddress = null

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

  if (resolveServerAddress) {
    const [dnsAddress, dnsPort] = resolveServerAddress.split(':')
    const dnsClient = new DNSClient(dnsPort, dnsAddress, cb, TYPE_A)

    dnsClient.search(address)
  } else {
    cb(new Error('Resolve server Address not set'))
  }
}

const resolve6 = (address, cb) => {
  if (typeof address !== 'string') {
    return cb(new Error('address should be a string'))
  }

  if (address[address.length - 1] !== '.') {
    address += '.'
  }

  if (resolveServerAddress) {
    const [dnsAddress, dnsPort] = resolveServerAddress.split(':')
    const dnsClient = new DNSClient(dnsPort, dnsAddress, cb, TYPE_AAAA)

    dnsClient.search(address)
  } else {
    cb(new Error('Resolve server Address not set'))
  }
}

/**
 * Sets which DNS server to contact
 * @param {string} address - IPv4 address or address with IP:PORT format
 * @return {boolean || string} resolveServerAddress - for tests
 */
const setResolveServer = (address) => {
  if (address === 'set null this plz') {
    resolveServerAddress = null
    return true
  }

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
