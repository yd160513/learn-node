const express = require('express')
const ejs = require('ejs')
// 实例化
const app = express()
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

app.post('/doLogin', (req, res) => {
  /**
   * post 请求获取传过来的参数: req.bdody, 但是不可以直接使用。
   * 需按照以下步骤:
   * 1. app.use(express.urlencoded({ extended: false }))
   * 2. app.use(express.json())
   */
  const params = req.body
  console.log(req.body)
  console.log('post 请求 - doLogin 传过来的参数: ', params.username)
  console.log('post 请求 - doLogin 传过来的参数: ', params.password)
  res.send(`执行提交 - ${params.username} - ${params.password}`)
})

app.get('/', (req, res) => {
  res.send('首页')
})
app.get('/login', (req, res) => {
  // get 方式获取传值
  // get.query
  res.render('login')
})

// 配置路由
// app.get('/', (req, res) => {
//   const title = '你好 ejs'
//   // 配置模板引擎第二步
//   res.render('index', {
//     // 这里的 title 会在模板文件中有对应的字段，用于展示到页面上
//     title
//   })
// })
// 配置路由
app.get('/news', (req, res) => {
  const user = {
    name: '张三',
    age: 18
  }
  // 配置模板引擎第二步
  res.render('news', {
    // 这里的 user 会在模板文件中有对应的字段，用于展示到页面上
    user
  })
})
/**
 * 配置路由。
 * 2. 路由级中间件: 
 * 这里有 /news/add 这个路由，正常情况下下边的动态路由: /news/:id 就不会匹配了。
 *    如果还想匹配下边的动态路由，可在这个路由里边调用 next() 方法。
 *    这个时候在 /news/add 这个路由中就不需要调用 res.send() 方法了， 这个方法放到动态路由: /news/:id 中去调用。
 */
app.get('/news/add', (req, res, next) => {
  // res.send('/news/add 路由')
  console.log('/news/add 路由')
  next()
})
// 配置路由: 动态路由
app.get('/news/:id', (req, res) => {
  console.log('/news/:id 动态路由')
  res.send('/news/:id 动态路由')
})
// 配置路由
app.get('/article', (req, res) => {
  const article = `<h3 style="border: 1px solid red;">这是一段 HTML</h3>`
  const list = [1, 2, 3, 4, 5, 6]
  const newList = [{
    name: '张三',
    age: 18
  }, {
    name: '张三',
    age: 18
  }]
  // 配置模板引擎第二步
  res.render('article', {
    // 这里的 article 会在模板文件中有对应的字段，用于展示到页面上
    article,
    flag: true,
    score: 30,
    list,
    newList
  })
})

// 3. 错误处理中间件。和应用级中间件差不多，只不过需要写在最后边
app.use((req, res, next) => {
  res.status(404).send('404')
})

// 监听端口，端口号建议写成 3000 以上
app.listen(3000)