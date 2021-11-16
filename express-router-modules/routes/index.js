const express = require('express')
// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('首页')
})

module.exports = router