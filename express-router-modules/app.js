const express = require('express')
const ejs = require('ejs')
// cookie-parser 中间件
const cookieParser = require('cookie-parser')
// express-session 中间件
const session = require('express-session')

// 引入外部模块
const admin = require('./routes/admin')
const index = require('./routes/index')
const api = require('./routes/api')

// 实例化
const app = express()
// 配置 cookieParser 中间件
app.use(cookieParser('xxxxx'))
// 配置 express-session 中间件
app.use(session({
  secret: 'xxx', // 服务器端生成 session 的签名
  name: 'username', // 修改 session 对应的 cookie 的名称
  resave: false, // 强制保存 session 即使它没有变化
  saveUninitialized: true, // 强制将未初始化的 session 存储
  // rolling: true, // 每次请求时如果 session 对应的 cookie 还没有过期，这个时候会重置过期时间
  cookie: {
    maxAge: 1000 * 60, // 过期时间
    secure: false, // true 表示只有 https 协议才能访问 cookie
  }
}))

/**
 * 中间件:
 * 1. 应用级中间件
 * 2. 路由级中间件
 * 3. 错误处理中间件
 * 4. 内置中间件
 * 5. 第三方中间件
 *    body-parser 已被弃用，改为 express 中自带的 express.urlencoded()
 */

/**
 * 配置模板引擎: 
 *  1. app.set('view engine', 'ejs')
 *  2. res.render('index', {})
 *  默认模板位置在 views 文件夹中(如果文件夹名称为 views, 在这里用的时候可以隐藏)
 *    更改模板位置: app.set('views', `${__dirname}/views/`)
 *  模板文件后缀名 ejs 也可更改为其他后缀
 * 更改模板后缀名:
 *  1. const ejs = require('ejs')
 *  2. 将 ejs 后缀更改为 html 后缀。
 *     注册 html 模板引擎代码: app.engine('html', ejs.__express)
 *  3. 修改文件后缀名为 html
 * 模板文件中引入 css 等这类的文件可以被称为静态文件，也就是 express 托管静态文件
 *  1. app.use(express.static('static'))
 *  2. 然后 static 目录就可以访问了
 */
// 配置模板引擎
// app.set('view engine', 'ejs')

// 将后缀名 ejs 更改为 html
app.engine('html', ejs.__express)
app.set('view engine', 'html')

// 4. 内置中间件: express.static()
// 托管静态文件/配置静态目录
app.use(express.static('static'))
// // 这个时候在访问资源的时候就需要在要访问的目录前边多加一个 public, 其实访问到的目录是 static 目录
// app.use('/public', express.static('static'))

// 为了使在 post 请求中可以直接使用 req.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// 1. 应用级中间件(用于权限判断)
app.use((req, res, next) => {
  console.log(new Date())
  // 必须要写 next(), 否则会卡死
  next()
})

// 配置外部路由模块
app.use('/admin', admin)
app.use('/', index)
app.use('/api', api)

app.use((req, res, next) => {
  res.status(404).send('404')
})

// 监听端口，端口号建议写成 3000 以上
app.listen(3000)