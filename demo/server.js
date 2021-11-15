const http = require('http')
const fs = require('fs')
const path = require('path')
const { getFileMimeAsync, getFileMime, getMime } = require('./module/common')



http.createServer(async (request, response) => {
  /**
   * 需求: 根据不同的请求路径来展示不同的页面
   *  1. 获取地址
   *  2. 根据地址用 fs 模块读取服务器上找对应文件
   */
  // 1. 获取地址
  // 兼容 URL 什么都不输入的时候
  let pathName = request.url === '/' ? '/index.html' : request.url

  // 过滤掉 url 上的参数
  const urlRes = new URL(request.url, `http://${request.headers.host}`)
  pathName = urlRes.pathname

  // 获取 url 后缀名
  const extname = path.extname(pathName)
  // 生成对应的 Content-Type
  // const type = getMime(extname)
  // const type = await getFileMime(extname)
  const type = getFileMimeAsync(extname)
  console.log('type => ', type)
  

  if (pathName !== '/favicon.ico') {
    // 2. 根据地址用 fs 模块读取服务器上找对应文件
    fs.readFile(`./static${pathName}`, (err, data) => {
      if (err) {
        // 设置响应头
        response.writeHead(404, { 'Content-Type': 'text/html;charset=utf-8' })
        // 设置返回内容
        response.end('这个页面不存在 - 404')

        return console.log('404')
      }

      // 设置响应头
      response.writeHead(200, { 'Content-Type': `${type};charset=utf-8` })
      // 设置返回内容
      response.end(data)
    })
  }

}).listen(8081) // 监听端口

console.log('Server running at http://127.0.0.1:8081/')