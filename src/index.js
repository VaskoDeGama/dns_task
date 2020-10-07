const { resolve4, resolve6, setResolveServer } = require('../src/dns')

setResolveServer('8.8.8.8')

const cb = (err, res) => {
  if (err) {
    console.log(err)
    return
  }

  console.log(res)
}

const address = process.argv[2]

console.log(address)

resolve4(address, cb)
resolve6(address, cb)
