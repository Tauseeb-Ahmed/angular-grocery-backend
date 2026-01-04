const http = require('http')

http.get('http://localhost:3000/groceries', res => {
  let body = ''
  res.on('data', c => body += c)
  res.on('end', () => {
    console.log('status', res.statusCode)
    console.log('body', body)
    process.exit(0)
  })
}).on('error', e => { console.error(e); process.exit(1) })
