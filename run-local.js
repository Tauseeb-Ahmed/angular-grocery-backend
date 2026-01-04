const http = require('http')
const handler = require('./api/index.js')

const server = http.createServer((req, res) => {
  handler(req, res)
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`listening on ${PORT}`))
