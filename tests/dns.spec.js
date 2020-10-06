const udpServer = require('../src/udpTestServer')
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
  })

  describe('RESOLVE4', () => {
    test('will be define', () => {
      expect(resolve4).toBeDefined()
    })
    test('should be err if address not string', done => {
      resolve4(3, (err) => {
        if (err) {
          expect(err.message).toBe('address should be a string')
          done()
        } else {
          done()
        }
      })
    })
    test('should be err if resolveServerAddress not set', done => {
      resolve4('google.com', (err) => {
        if (err) {
          expect(err.message).toBe('Resolve server Address not set')
          done()
        } else {
        }
      })
    })
    test('should be error if req timed out', done => {
      setResolveServer('1.1.1.1:8080')
      resolve4('google.com', (err) => {
        if (err) {
          console.log(err)
          expect(err.message).toBe('Request timed out')
          done()
        } else {
        }
      })
    })
    test('should be something', done => {
      setResolveServer('1.1.1.1')
      resolve4('google.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          expect(res).toBeDefined()
          done()
        }
      })
    })
    test('filtering nose', done => {
      setResolveServer('127.0.0.1:1234')
      resolve4('google.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(res).toBeDefined()
          done()
        }
      })
    })
    test('should be array with not zero length', done => {
      setResolveServer('8.8.8.8')
      resolve4('google.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBeGreaterThan(0)
          done()
        }
      })
    })
    test('should be array with zero length if not found', done => {
      setResolveServer('93.81.253.51')
      resolve4('qwerty', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
    test('test moscow dns', done => {
      setResolveServer('93.81.253.51')
      resolve4('polka.typekit.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).not.toBe(0)
          done()
        }
      })
    })
    test('not compression zero', done => {
      setResolveServer('176.103.130.130')
      resolve4('mail.google.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
    test('not compression not zero', done => {
      setResolveServer('176.103.130.130')
      resolve4('googlemail.l.google.com', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).not.toBe(0)
          done()
        }
      })
    })
    test('mixed types', done => {
      setResolveServer('10.1.30.1')
      resolve4('adservice.google.ru', (err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
          expect(Array.isArray(res)).toBeTruthy()
          expect(res.length).toBe(0)
          done()
        }
      })
    })
  })

  describe('RESOLVE6', () => {
    test('will be define', () => {
      expect(resolve6).toBeDefined()
    })
  })
})
