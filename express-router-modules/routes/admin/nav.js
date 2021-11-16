const express = require('express')
// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('导航列表')
})

router.get('/add', (req, res) => {
  res.send('增加导航')
})

router.get('/edit', (req, res) => {
  res.send('修改导航')
})

router.get('/doAdd', (req, res) => {
  res.send('执行增加导航')
})

router.get('/doEdit', (req, res) => {
  res.send('执行修改导航')
})

module.exports = router