const { basename, extname } = require('path')
const { createReadStream } = require('fs')
const { filePath, getObject, baseHeader, s3Header } = require('./config/index')
const { getSTCSignHandle, postApi, getApi, putApi, postApi2 } = require('./api/index')
const { getFileMimeAsync } = require('./util/index')
const { put } = require('request')

let globalSign = null

// 读取文件
const readFileHandle = (filePath) => {
  const fileType = extname(filePath)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(fileType)
  const { utcDate, signature } = globalSign
  let config = {
    headers: {
      ...s3Header,
      'Content-type': type || 'text/plain',
      'Authorization': signature,
      'x-amz-date': utcDate,

    }
  };
  console.log('header =>', config)

  // 创建读取流
  const readStream = createReadStream(filePath)
  // 读取次数
  let count = 0
  // 读取到的数据
  const chunks = []
  return new Promise((resolve, reject) => {
    // 监听读取数据
    readStream.on('data', chunk => {
      chunks.push(chunk)
      count++
    })
    // 读取完毕
    readStream.on('end', () => {
      const bufferDat = Buffer.concat(chunks)
      console.log(`读取完毕！一共读取了 ${count} 次。`)
      resolve(bufferDat)
    })
    // 读取失败
    readStream.on('error', (err) => {
      console.log(err)
      reject(err)
    })
  })

}

const getUploadURL = (object) => {
  const { protocol, endpoint, bucket } = globalSign
  return `${protocol}://${endpoint}/${bucket}${object}`
}

// 上传接口
const uploadApi = (uploadURL, bufferData) => {
  return new Promise((resolve, reject) => {
    const { utcDate, signature } = globalSign
    const fileType = extname(filePath)
    const type = getFileMimeAsync(fileType)
    const params = {
      url: uploadURL,
      headers: {
        ...s3Header,
        'Content-type': type || 'text/plain',
        'Authorization': signature,
        'x-amz-date': utcDate,
      },
      body: bufferData
    }
    put(params, function (error, response, body) {
      console.log(response)
      if (error || response.statusCode !== 200) {
        reject(error)
        return console.error(`文件上传失败!`, { error, code: response.statusCode })
      }
      resolve(`上传成功!`)
    });
  })
}

// 上传
const upload = async (filePath) => {
  const object = getObject(filePath)
  console.log(`获取到的 object 是: `, object)
  // 获取签名
  const { data } = await getSTCSignHandle('PUT', object);
  globalSign = data
  console.log(`获取到的签名是: `, globalSign)
  // 获取上传路径
  const uploadURL = getUploadURL(object)
  console.log(`上传路径为: ${uploadURL}`)
  // 读取文件
  const bufferData = await readFileHandle(filePath)
  console.log('文件读取完毕，开始上传')
  // 上传文件
  await uploadApi(uploadURL, bufferData)
}

upload(filePath)