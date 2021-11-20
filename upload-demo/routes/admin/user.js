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
  // res.send('增加用户')
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

  // 读文件流 -----------------
  // 创建读取流
  const readStream = createReadStream(filePath)

  // 读取次数
  let count = 0
  // 读取到的数据
  let str = ''

  /**
   * 监听读取数据
   * chunk: 是 Buffer 类型
   */
  readStream.on('data', async (chunk) => {
    str += chunk
    count++
    console.log(`当前读取次数为: ${count}`)

    uploadHandle(filePath)

    // // 获取签名
    // const sign = await getSTCSign(filePath)
    // console.log(`获取到的签名是: `, sign)

    // // 获取上传路径
    // getUploadURL(sign)

    // // 开始上传

  })
  // 读取完毕
  readStream.on('end', () => {
    console.log(`总读取次数为: ${count}`)
  })
  // 读取失败
  readStream.on('error', (err) => {
    console.log(err)
  })


  res.send({
    params: req.body
  })
})

router.post('/doEdit', (req, res) => {
  res.send('执行修改')
})

module.exports = router
