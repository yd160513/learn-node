const http = require('http')


// const url = require('url')
// url.parse('') // 已被弃用
// 现在全局有 URL 类， 不需要单独引入 url 模块， 可以直接 new URL() 得到对应结果
// new URL()
// 也可以从 url 模块中引入 URL
// const { URL } = require('url')

// 全局安装 nodemon 可以是显示 node 文件的热更新，只需手动刷新页面即可
// npm i nodemon -g
// nodemon [被监听的文件]

http.createServer(function (request, response) {
  if (request.url !== '/favicon.ico') {
    // 得到的是一个 url 对象
    const urlRes = new URL(request.url, `http://${request.headers.host}`)
    // 得到当前 url 的所有参数。放在一个 map 中
    const params = urlRes.searchParams
    console.log(`name => ${params.get('name')}, age => ${params.get('age')}`)
  }
  /**
   * 设置响应头
   * 状态码: 200
   */
  response.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
  // 返回给前端的
  response.end('Hello Nodejs - 热更新');

}).listen(8081); // 监听端口

console.log('Server running at http://127.0.0.1:8081/');