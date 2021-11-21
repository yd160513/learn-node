// 直接执行此文件则可以实现文件上传
const os = require('os')
const Axios = require('axios')
const path = require('path')
const fs = require('fs')

const sha256 = require("sha256")
const sha256Str = sha256('beem')

const { getUploadURL, getFileMimeAsync, header, filePath, getSTCSign } = require('./config/index')

// 上传第二部: 上传
const uploadApi = (url, filePath, sign, chunk) => {
  const extname = path.extname(filePath)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(extname)
  let config = {
    headers: {
      ...header,
      'Content-type': type || 'text/plain',
      'Authorization': sign.signature,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-content-sha256': sha256Str,
      'x-amz-expires': '900', // 和服务端统一
      'x-amz-date': sign.utcDate,
    }
  };
  Axios.put(url, chunk, config).then(res => {
    console.log('当前 chunk 上传完毕')
  }).catch(err => {
    console.log('上传失败', err)
  })
}

// 上传第一步: 读流
const readStreamHandle = (url, filePath, sign) => {
  const extname = path.extname(filePath)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(extname)
  let config = {
    headers: {
      ...header,
      'Content-type': type || 'text/plain',
      'Authorization': sign.signature,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-content-sha256': sha256Str,
      'x-amz-expires': '900', // 和服务端统一
      'x-amz-date': sign.utcDate,

    }
  };
  console.log('header =>', config)
  // 创建读取流
  const readStream = fs.createReadStream(filePath)

  // 读取次数
  let count = 0
  // 读取到的数据
  const chunks = []

  // 监听读取数据
  readStream.on('data', chunk => {
    chunks.push(chunk)
    count++
  })
  // 读取完毕
  readStream.on('end', () => {
    const bufData = Buffer.concat(chunks)
    console.log(`读取完毕！一共读取了 ${count} 次。`)
    console.log('开始异步上传')
    try {
      uploadApi(url, filePath, sign, bufData)
    } catch (error) {
      console.log('try catch 捕获到错误: ', error)
    }
  })
  // 读取失败
  readStream.on('error', (err) => {
    console.log(err)
  })
}

const uploadHandle = async (filePath) => {
  // 获取签名
  const sign = await getSTCSign(filePath)
  console.log(`获取到的签名是: `, sign)
  // 获取上传路径
  const uploadURL = getUploadURL(sign)
  console.log(`上传路径为: ${uploadURL}`)
  // 上传文件
  readStreamHandle(uploadURL, filePath, sign)
}

uploadHandle(filePath)
