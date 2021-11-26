const https = require('https')
const { extname } = require('path')
const fs = require('fs')
const { put } = require('request')
const {
  filePath,
  sha256,
  sha256Str,
  appToken,
  uid,
  lastOcode,
  beemLang,
  version,
  context,
  ver,
  header,
  getObject,
  getSTCSign,
  getFileMimeAsync,
  getUploadURL,
  getHeaders } = require('./index')

// 上传第二d部: 上传
const uploadApi = (url, filePath, sign, chunk) => {
  const fileType = extname(filePath)
  const options = {
    url,
    headers: getHeaders(fileType, sign),
    body: chunk
  }
  put(options, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return console.error(`文件上传失败!`, { error, code: response.statusCode })
    }
    console.log(`上传成功!`, body)
  });
}

// 上传第一步: 读流
const readStreamHandle = (url, filePath, sign) => {
  const fileType = extname(filePath)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(fileType)
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
  const type = extname(filePath)
  // 获取签名
  const sign = await getSTCSign(type)
  console.log(`获取到的签名是: `, sign)
  // 获取上传路径
  const uploadURL = getUploadURL(sign)
  console.log(`上传路径为: ${uploadURL}`)
  // 上传文件
  readStreamHandle(uploadURL, filePath, sign)
}

uploadHandle(filePath)

module.exports = {
  // 上传入口
  uploadHandle,
  // 根据 sign 获取上传接口
  getUploadURL,
  // 获取 Content-Type
  getFileMimeAsync,
  // 请求头
  header,
  // 文件路径
  filePath,
  // 获取签名
  getSTCSign
}

