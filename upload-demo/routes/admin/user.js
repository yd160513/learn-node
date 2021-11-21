const express = require('express')
const { createReadStream, accessSync, statSync } = require('fs')
const tools = require('../../modules/tools')
const { uploadHandle } = require('../../config/index')

// 路由模块化
const router = express.Router()

router.get('/', (req, res) => {
  res.send('用户列表')
})

router.get('/add', (req, res) => {
  res.render('admin/user/add.html')
})

router.get('/edit', (req, res) => {
  res.send('修改用户')
})

// 判断当前目录是否存在
const isHas = (path) => {
  let notExist
  try {
    // 如果只是单纯的想检测文件目录是否存在，建议使用: fs.access()
    // const statData = statSync(filePath)
    // console.log(`fs.stat: file info =>`, statData)
    // accessSync() 如果存在的话则没有任何返回，反之会报错
    notExist = accessSync(path)
    return !notExist
  } catch (error) {
    console.log(`文件不存在`, error)
  }
}

// 多文件上传
const multipleFile = tools.multer().fields([{ name: 'pic', maxCount: 1 }, { name: 'pic2', maxCount: 1 }])
router.post('/doAdd', multipleFile, (req, res) => {
  // 获取传过来的文件路径
  const filePath = req.body.path

  // 检测当前路径是否存在 -----------------
  if (!isHas(filePath)) {
    // 文件不存在则 return
    return res.send(`${filePath} 路径不存在`)
  }
  console.log(`${filePath} 路径正确`)
  // 开始上传
  uploadHandle(filePath)
  
  res.send({
    params: req.body
  })
})

module.exports = router
