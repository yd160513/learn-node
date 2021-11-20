const os = require('os')
const http = require('http')
const https = require('https')
// 小文件路径
const filePath = '/Users/kouyidong/Documents/problem/20/upload-demo/物业关于摩托车、非机动车管理的通知.pdf'
// 大文件路径
// const filePath = '/Users/kouyidong/Documents/problem/20/upload-demo/4.73 G的压缩包.zip'
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

const uploadHandle = async (filePath) => {
  // 获取签名
  const sign = await getSTCSign(filePath)
  console.log(`获取到的签名是: `, sign)
  // 获取上传路径
  const uploadURL = getUploadURL(sign)
  console.log(`上传路径为: ${uploadURL}`)
  // 上传文件
  // ...
}

module.exports = {
  uploadHandle
  // getSTCSign,
  // getUploadURL
}


