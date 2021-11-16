const express = require('express')
// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.render('login')
})

router.post('/doLogin', (req, res) => {
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

module.exports = router