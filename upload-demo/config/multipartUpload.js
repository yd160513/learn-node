/**
 * 1. 创建上传
 * 2. 根据文件路径得到总大小，计算分块大小以及分块数量
 * 3. 按照分块读取文件
 * 4. 调用接口组合分片
 */

const { post } = require('request')
const { basename, extname } = require('path')
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
  getHeaders,
  getUploadURL } = require('./index')

// 1. 创建上传
const createUploadHandle = async () => {
  const fileName = basename(filePath)
  // 获取 object (这里获取到的 object 为最原始的 object, 后边产生的 object 均不存储，仅作为临时使用)
  // const object = getObject(fileName);
  // console.log('创建上传中拿到的 object:', object)
  const type = extname(fileName)
  // 获取签名
  const sign = await getSTCSign(type)
  const uploadURL = getUploadURL(sign);
  const options = {
    url: uploadURL,
    json: true,
    headers: {
      // ...getHeaders(type, sign),
      // "Content-type": 'application/json',
      'Authorization': sign.signature,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-content-sha256': sha256Str,
      'x-amz-expires': '900', // 和服务端统一
      'x-amz-date': sign.utcDate,
    }
  }
  console.log('options: ', options)
  // 调用接口创建上传
  post(options, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return console.error(`创建上传失败!`, { error, code: response.statusCode })
    }
    console.log(`创建上传成功`, body)
  })

  // const res = await axiosUploadPost({
  //   url,
  //   params: {
  //   },
  //   config: {
  //     headers: {
  //       'Content-type': file.type || 'text/plain', // application/octet-stream
  //       'Authorization': signature,
  //       'x-amz-algorithm': 'AWS4-HMAC-SHA256',
  //       'x-amz-content-sha256': sha256Str,
  //       'x-amz-expires': '900', // 和服务端统一
  //       'x-amz-date': utcDate
  //     }
  //   }
  // }, messageUId)
  // const xmlJson = JSON.parse(XMLToJSON(res))
  // const result: CreateMultipartUploadResult = {
  //   url,
  //   Key: xmlJson.elements[0].elements[1].elements[0].text,
  //   UploadId: xmlJson.elements[0].elements[2].elements[0].text
  // }
  // return result
}

createUploadHandle()