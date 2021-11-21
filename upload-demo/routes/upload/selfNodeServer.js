const express = require('express')
const tools = require('../../modules/tools')

// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('导航列表')
})

router.get('/add', (req, res) => {
  res.render('admin/nav/add.html')
  // res.send('增加导航')
})

router.get('/edit', (req, res) => {
  res.send('修改导航')
})

router.post('/doAdd', tools.multer().single('pic'), (req, res) => {
  // 获取表单传过来的数据
  const params = req.body
  res.send({
    params: params,
    file: req.file
  })
  // res.send('执行增加导航')
})

router.post('/doEdit', (req, res) => {
  res.send('执行修改导航')
})

module.exports = router