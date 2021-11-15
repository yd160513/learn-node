const fs = require('fs')

exports.getMime = function (extname) {
  switch (extname) {
    case '.html':
      return 'text/html'
    case '.css':
      return 'text/css'
    case '.js':
      return 'text/javascript'
    default:
      return 'text/html'
  }
}

exports.getFileMime = function (extname) {
  return new Promise((resolve, reject) => {
    // 这里相对于执行目录,相对于 server.js
    fs.readFile('./static/assets/mime.json', (err, data) => {
      if (err) {
        reject(err)
        return console.log('读取失败!', err)
      }
      // json 中的所有信息
      const mimeObj = JSON.parse(data.toString())
      // 根据后缀名获取对应的 Content-Type
      resolve(mimeObj[extname])
    })
  })
}

exports.getFileMimeAsync = function (extname) {
  const data = fs.readFileSync('./static/assets/mime.json')
  const mimeObj = JSON.parse(data.toString())
  return mimeObj[extname]
}