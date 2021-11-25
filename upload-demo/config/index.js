const os = require('os')
const http = require('http')
const https = require('https')
const Axios = require('axios')
const path = require('path')
// 小文件路径
// const filePath = '/Users/kouyidong/Documents/problem/20/upload-demo/物业关于摩托车、非机动车管理的通知.pdf'
const filePath = '/Users/kouyidong/Documents/test/shoukuanma.png'

// 大文件路径
// const filePath = '/Users/kouyidong/Documents/problem/20/upload-demo/4.73 G的压缩包.zip'
// const filePath = '/Users/kouyidong/Documents/test/100M图片.jpg'
const sha256 = require("sha256")
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');


const sha256Str = sha256('beem')
const appToken = `MbnLHUX_rmUJyI51S-G_d2XhvxZ94PB1fbndJUyG95qcOUoujwyppC8duYwuZqOgeZKLZbUxud0k`
const uid = '13hLe_EB4hlb_LL7rOvH-1'
const lastOcode = 'RAUC9MVR'
const deviceId = 'com.beem.beemworkuat!2F8C32F6-5422-41B3-B673-547E35D38ACE'
const beemLang = 'en-US'
const version = '1.0.0-100'

// const context = `http://120.92.86.2:9000`
const context = `https://gateway-beemtest-1.rongcloud.net`
const ver = `v1`


const header = {
  "Content-type": 'application/x-www-form-urlencoded',
  "Authorization": `Beem ${appToken}`,
  "app-ver": version,
  uid,
  "ocode": lastOcode,
  // "device-id": deviceId,
  'device-id': 'a0:78:17:67:f4:c6',
  "device-type": os.type() === 'Darwin' ? '3' : '4',
  "lang": beemLang,
  "os-ver": '11',
  "ts": Date.now(),
  "ts-sign": '41e3d2a6bc1e2a5015a36edeaa9f6c72',
  "nonce": Math.ceil(Math.random() * Math.pow(10, 10))
}

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
    data = fs.readFileSync('./static/assets/mime.json')
    // debug 当前文件的时候
    // data = fs.readFileSync('./upload-demo/static/assets/mime.json')
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


