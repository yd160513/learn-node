const express = require('express')
// 路由模块化
const router = express.Router()

// 将文件上传到第三方服务器
router.get('/', (req, res) => {
  res.render('upload/thirdPartyServer.html')
})
// 将文件上传到自己的 node 服务器
router.get('/upload', (req, res) => {
  res.render('upload/selfNodeServer.html')
})

module.exports = router