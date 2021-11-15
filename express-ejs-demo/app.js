const express = require('express')
const ejs = require('ejs')

const app = express()

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

// 托管静态文件
app.use(express.static('static'))
// // 这个时候在访问资源的时候就需要在要访问的目录前边多加一个 public, 其实访问到的目录是 static 目录
// app.use('/public', express.static('static'))


// 配置路由
app.get('/', (req, res) => {
  const title = '你好 ejs'
  // 配置模板引擎第二步
  res.render('index', {
    // 这里的 title 会在模板文件中有对应的字段，用于展示到页面上
    title
  })
})
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


// 监听端口，端口号建议写成 3000 以上
app.listen(3000)