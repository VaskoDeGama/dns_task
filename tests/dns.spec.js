const UdpTestServer = require('../src/udpTestServer')
const { resolve4, resolve6, setResolveServer } = require('../src/dns')

describe('DNS', () => {
  describe('SET_RESOLVE_SERVER', () => {
    test('will be define', () => {
      expect(setResolveServer).toBeDefined()
    })
    test('should be function', () => {
      expect(typeof setResolveServer).toBe('function')
    })
    test('should set address', () => {
      expect(setResolveServer('1.1.1.1:53')).toBe('1.1.1.1:53')
    })
    test('should add default port', () => {
      expect(setResolveServer('1.1.1.1')).toBe('1.1.1.1:53')
    })
    test('dont should do anything if wrong input sting', () => {
      expect(setResolveServer('1.1')).toBe(false)
      expect(setResolveServer(4)).toBe(false)
    })
    afterAll(() => {
      setResolveServer('set null this plz')
    })
  })

  describe('RESOLVE4', () => {
    let server = null

    beforeAll(() => {
      server = new UdpTestServer(1234, '127.0.0.1')
      server.start()
    }, 3000)

    test('will be define', () => {
      expect(resolve4).toBeDefined()
    })
    test('should be err if address not string', done => {
      resolve4(3, (err) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('address should be a string')
          done()
        } else {
          done()
        }
      })
    })
    test('should be err if resolveServerAddress not set', done => {
      setResolveServer('set null this plz')

      resolve4('google.com', (err) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('Resolve server Address not set')
          done()
        } else {
          done()
        }
      })
    })
    test('should be error if req timed out', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('nothing', (err, res) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('Request timed out')
          done()
        } else {
          console.log(res)
        }
      })
    })
    test('should be 6 ipv4 address', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('googl.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(6)
          done()
        }
      })
    })
    test('should be others  6 ipv4 address', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('google.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(6)
          done()
        }
      })
    })
    test('should be empty array', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('mail.google.mail.google.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
    test('also should be empty array', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('ru.net.co.net.dot.hex.', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })

    afterAll(() => {
      server.stop()
    }, 4000)
  })

  describe('RESOLVE6', () => {
    let server = null

    beforeAll(() => {
      server = new UdpTestServer(1234, '127.0.0.1')
      server.start()
    }, 3000)

    test('will be define', () => {
      expect(resolve4).toBeDefined()
    })
    test('should be err if address not string', done => {
      resolve4(3, (err) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('address should be a string')
          done()
        } else {
          done()
        }
      })
    })
    test('should be err if resolveServerAddress not set', done => {
      setResolveServer('set null this plz')

      resolve4('google.com', (err) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('Resolve server Address not set')
          done()
        } else {
          done()
        }
      })
    })
    test('should be error if req timed out', done => {
      setResolveServer('127.0.0.1:1234')
      resolve6('nothing', (err, res) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('Request timed out')
          done()
        } else {
          console.log(res)
        }
      })
    })
    test('should be 4 ipv6 address', done => {
      setResolveServer('127.0.0.1:1234')
      resolve6('googl.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(4)
          done()
        }
      })
    })
    test('should be others  4 ipv6 address', done => {
      setResolveServer('127.0.0.1:1234')
      resolve6('google.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(4)
          done()
        }
      })
    })
    test('should be empty array', done => {
      setResolveServer('127.0.0.1:1234')
      resolve6('mail.google.mail.google.com', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
    test('also should be empty array', done => {
      setResolveServer('127.0.0.1:1234')
      resolve6('ru.net.co.net.dot.hex.', (err, res) => {
        if (err) {
          console.log(err)
          done()
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
    afterAll(() => {
      server.stop()
    }, 4000)
  })
})
