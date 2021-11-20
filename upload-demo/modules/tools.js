const express = require('express')
const multer = require('multer')
const path = require('path')
const moment = require('moment')
const mkdirp = require('mkdirp')


let tools = {
  multer() {
    /**
     * 上传中间件
     * dest: 上传到哪里。服务端的目录， 这个目录必须存在。
     * 在 form 表单提交的接口中的第二个参数: upload.single('pic')。 这里传入的 pic 是和 form 表单中定义的 name 相匹配的。
     */
    // const upload = multer({ dest: 'static/upload/' }) // 这种方式上传到服务器上的名称是不对的，只有名称(乱码)没有后缀名
    // 采用这种方式: 解决名称不对的问题
    const storage = multer.diskStorage({
      // 配置上传的目录
      destination: async (req, file, cb) => {

        // cb(null, 'static/upload/') // 上传到哪里。服务端的目录， 这个目录必须存在。

        /**
         * 需求: 按照日期生成上传目录
         * 1. 获取当前日期
         * 2. 按照日期生成图片存储目录
         */
        // 1. 获取当前日期
        const day = moment(Date.now()).format('YYYYMMDD');
        const dir = path.join('static/upload', day)
        // 2. 按照日期生成图片存储目录
        await mkdirp(dir)
        cb(null, dir) // 上传到哪里。服务端的目录， 这个目录必须存在。
      },
      // 配置服务器上的文件名称
      filename: function (req, file, cb) {
        /**
         * file: {
         *  fieldname: "pic",
         *  originalname: "产品反馈.jpeg",
         *  encoding: "7bit",
         *  mimetype: "image/jpeg",
         *  destination: "static/upload/",
         *  filename: "61fc5372ddd7d9ca373cfba22a0b9a75",
         *  path: "static/upload/61fc5372ddd7d9ca373cfba22a0b9a75",
         *  size: 1010706
         *  }
         */
        // 1. 获取后缀名
        const extname = path.extname(file.originalname)
        const name = file.originalname.split(extname)[0]
        // 2. 生成文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, `${file.fieldname}-${uniqueSuffix}${extname}`)
        cb(null, `${name}_${Date.now()}${extname}`)
      }
    })

    const upload = multer({ storage: storage })

    return upload
  },

  md5() {

  }
}

module.exports = tools