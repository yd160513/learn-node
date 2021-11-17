const express = require('express')
const tools = require('../../modules/tools')

// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('用户列表')
})

router.get('/add', (req, res) => {
  res.render('admin/user/add.html')
  // res.send('增加用户')
})

router.get('/edit', (req, res) => {
  res.send('修改用户')
})

// 多文件上传
const multipleFile = tools.multer().fields([{ name: 'pic', maxCount: 1 }, { name: 'pic2', maxCount: 1 }])
router.post('/doAdd', multipleFile, (req, res) => {
  res.send({
    params: req.body,
    files: req.files
  })
})

router.post('/doEdit', (req, res) => {
  res.send('执行修改')
})

module.exports = router