
const http = require('http')
const https = require('https')
const Axios = require('axios')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');
const { put } = require('request')
const { filePath,
  sha256,
  sha256Str,
  appToken,
  uid,
  lastOcode,
  beemLang,
  version,
  context,
  ver,
  header } = require('./index')

/**
 * 根据文件名称返回上传文件需要的 object
 * @param fileName 文件名称
 */
const getObject = (filePath) => {
  // 生成上传文件名
  const splitArr = filePath.split('/')
  const fileName = splitArr[splitArr.length - 1]
  const type = fileName.substr(fileName.lastIndexOf('.'))
  const randomName = `${uuidv4()}${new Date().getTime()}`
  return `/beem/${randomName}${type}`
}

// 获取签名
const getSTCSign = (filePath) => {
  let sign

  // 获取上传所需要的 object
  const object = getObject(filePath)

  // 获取签名
  return new Promise((resolve, reject) => {
    // 上传接口地址
    const url = `${context}/store/${ver}/s3/sign?method=PUT&object=${object}`

    // 发送请求
    const req = https.request(url, {
      method: 'get',
      headers: {
        // S3 需要的请求头
        'x-amz-algorithm': 'AWS4-HMAC-SHA256',
        'x-amz-content-sha256': sha256Str,
        'x-amz-expires': '900', // 和服务端统一
        // 接口通用的 header
        ...header
      }
    }, res => {
      res.on('data', chunk => {
        // 这里拿到的是文件流，所以需要先转成 string, 然后将 string 再解析才可以拿到最终的 JSON
        const chunkStr = chunk.toString()
        const result = JSON.parse(chunkStr)
        process.stdout.write(`响应主体 =>`)
        sign = result.data
      });
      res.on('end', () => {
        console.log('获取 token 响应结束')
        resolve({ object, ...sign })
      })
    })
    req.on('error', (err) => {
      console.log(err, `请求错误`)
      reject(err)
    })
    req.end()
  })

}

const getUploadURL = ({ protocol, endpoint, bucket, object }) => {
  return `${protocol}://${endpoint}/${bucket}${object}`
}

const getFileMimeAsync = function (extname) {
  let data
  try {
    // 当做服务启动的时候
    // data = fs.readFileSync('./static/assets/mime.json')
    // debug 当前文件的时候
    data = fs.readFileSync('../../upload-demo/static/assets/mime.json')
  } catch (error) {
    console.log(error)
    data = {}
  }
  const mimeObj = JSON.parse(data.toString())
  return mimeObj[extname]
}

// 上传第二部: 上传
const uploadApi = (url, filePath, sign, chunk) => {
  const extname = path.extname(filePath)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(extname)
  const headers = {
    ...header,
    'Content-type': type || 'text/plain',
    'Authorization': sign.signature,
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-content-sha256': sha256Str,
    'x-amz-expires': '900', // 和服务端统一
    'x-amz-date': sign.utcDate,
  }
  const options = {
    url,
    headers,
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

