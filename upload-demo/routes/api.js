const express = require('express')
// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('api 接口')
})

module.exports = router