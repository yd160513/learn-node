const express = require('express')
const login = require('./admin/login')
const nav = require('./admin/nav')
const user = require('./admin/user')

// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('后台管理中心')
})

router.use('/user', user)
router.use('/nav', nav)
router.use('/login', login)

module.exports = router