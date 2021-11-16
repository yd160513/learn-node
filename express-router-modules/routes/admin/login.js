const express = require('express')
// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('用户登录页面')
})

router.get('/doLogin', (req, res) => {
  res.send('执行登录')
})

module.exports = router