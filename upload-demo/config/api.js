const { basename, extname } = require('path')
const { createReadStream, statSync } = require('fs')
const Axios = require('axios')
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types')
const { json2xml, xml2json } = require('xml-js')

const {
  filePath,
  context,
  ver,
  sha256Str,
  header } = require('./index')

const fileName = basename(filePath)

const fileType = extname(fileName)
// const headers = getHeaders(fileType)

let globalSign = null

// 添加请求拦截器
Axios.interceptors.request.use(function (config) {
  console.log('请求头: ', JSON.stringify(config.headers))
  // 在发送请求之前做些什么
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});
/**
 * 根据 json 转 xml 字符串
 * @param {xml} args 要被转换为 json 的 xml
 */
const jsonToXml = (args) => {
  return json2xml(args)
}

/**
 * 根据 xml 转 json
 * @param {xml} args 要被转换为 json 的 xml
 */
const xmlToJson = (args) => {
  return xml2json(args)
}

// 根据文件类型获取对应的 Content-Type
const getFileMimeAsync = function (type) {
  return mime.lookup(type)
}

const getHeaders = (fileType, sign) => {
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(fileType)
  const headers = {
    ...header,
    'Content-type': type || 'text/plain',
    'Authorization': sign.signature,
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-content-sha256': sha256Str,
    'x-amz-expires': '900', // 和服务端统一
    'x-amz-date': sign.utcDate,
  }
  return headers
}

const postApi = ({ url, header, params }) => {
  return new Promise((resolve, reject) => {
    Axios({
      method: 'post',
      url,
      params,
      headers: {
        ...header
      }
    }).then(res => {
      resolve(res);
    }).catch(error => {
      reject(error);
    })
  })
}

const getUploadURL = (object) => {
  const { protocol, endpoint, bucket } = globalSign
  return `${protocol}://${endpoint}/${bucket}${object}`
}


const getApi = ({ url, method, object }) => {
  return new Promise((resolve, reject) => {
    Axios.get(url, {
      params: {
        method,
        object
      },
      headers: {
        ...header,
        // S3 需要的请求头
        'x-amz-algorithm': 'AWS4-HMAC-SHA256',
        'x-amz-content-sha256': sha256Str,
        'x-amz-expires': '900', // 和服务端统一
      },
    }).then(res => {
      resolve(res.data);
    }).catch(error => {
      reject(error);
    })
  })
}

/**
 * 获取 URL
 * @param {string} name 文件名称(包含后缀名)
 * @returns 
 */
const getObject = (name) => {
  // 获取文件后缀名(.xxx)
  const type = extname(name)
  const randomName = `${uuidv4()}${new Date().getTime()}`
  const url = `/beem/${randomName}${type}`
  return url
}

/**
 * 获取 STC 签名
 * @param method STC 的请求方法
 * @param object STC 的 object 就是 url + 参数
 */
const getSTCSignHandle = async (method, object) => {
  // 上传接口地址
  const url = `${context}/store/${ver}/s3/sign`
  const config = {
    url,
    object,
    method
  }
  const res = await getApi(config)
  return res
}

const getSTCSign = async () => {
  const object = getObject(fileName)
  // 上传时的参数
  const args = `${object}?uploads`
  // 获取签名
  const res = await getSTCSignHandle('POST', args);
  return res
}

// 获取文件
const getPartFile = (startPos, endPos) => {
  const chunks = []
  let partRes = []
  let len = 0
  //创建一个readStream对象，根据文件起始位置和结束位置读取固定的分片
  let readStream = createReadStream(filePath, { start: startPos, end: endPos });
  return new Promise((resolve, reject) => {
    readStream.on('data', (chunk) => {
      chunks.push(chunk)
      len += chunk.length
    });
    readStream.on('end', () => {
      // let blob = new Blob(arr);
      // console.log("blog", blob);
      // resolve(blob);
      partRes = Buffer.concat(chunks, len)
      resolve(partRes)
    });
    readStream.on('error', () => {
      // let blob = new Blob(arr);
      // resolve(blob);
      partRes = Buffer.concat(chunks, len)
      resolve(partRes)
    });
  })
}

// 分片计算
const computeHandle = async () => {
  // 每块大小
  const chunkSize = 20480 // 20kb
  console.log('分块大小: ', chunkSize)
  // 文件大小
  const fileSize = statSync(filePath).size
  console.log('文件总大小: ', fileSize)
  // 总块数
  const total = Math.ceil(fileSize / chunkSize)
  console.log('总块数: ', total)
  // 分块计算
  const res = await fragmentationHandle(fileSize, chunkSize)
  return res
}

/**
 * 分片处理
 * @param {number} startByte 分片开始的位置，默认是第 0 个字节
 * @returns endByte 分片结束的位置
 */
const fragmentationHandle = async (fileSize, chunkSize, startByte = 0, partList = []) => {
  // 分片从 0byte 开始，每次递增一个 chunkSize。
  let endByte = startByte + chunkSize
  // 当前正在读取的是第几片
  let partNumber = endByte / chunkSize

  // 开始字节等于总大小则说明全部读取完毕
  if (startByte === fileSize) {
    console.log('文件全部读取完毕')
    return partList
  }

  // 如果 stratByte + chunkSize > fileSize 则说明是最后一个分片，
  if (endByte >= fileSize) {
    endByte = fileSize
  }
  console.log(`当前正在读取的是第${partNumber}片, 开始位置: ${startByte}; 结束位置: ${endByte}.`)

  // 分片读取
  const part = await getPartFile(startByte, endByte)
  partList.push({
    partNumber,
    part
  })
  console.log(`${startByte}-${endByte}读取结束! 长度为: ${part.length}`)
  return fragmentationHandle(fileSize, chunkSize, endByte, partList)
}

// 创建上传
const createUploadHandle = async (args) => {
  // 根据文件服务器地址结合 uploads 生成创建上传的接口地址
  const createUploadURL = getUploadURL(args)
  console.log('创建上传接口地址: ', createUploadURL)
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(fileType)
  const { signature, utcDate } = globalSign
  const header = {
    'Content-type': type || 'text/plain',
    'Authorization': signature,
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-content-sha256': sha256Str,
    'x-amz-expires': '900', // 和服务端统一
    'x-amz-date': utcDate,
  }
  const params = {
    url: createUploadURL,
    header
  }
  // 2. 调用创建上传接口
  const res = await postApi(params)
  const xmlJson = JSON.parse(xmlToJson(res.data))
  const result = {
    url: createUploadURL,
    key: xmlJson.elements[0].elements[1].elements[0].text,
    uploadId: xmlJson.elements[0].elements[2].elements[0].text
  }
  res.data = result
  return res
}

const putApi = ({ url, params, header }) => {
  // console.log(`putApi: `, { url, params, header })
  return new Promise((resolve, reject) => {
    Axios({
      method: 'put',
      url,
      data: params.part,
      headers: header,
      'maxContentLength': Infinity,
      'maxBodyLength': Infinity
    }).then(res => {
      resolve(res);
    }).catch(error => {
      reject(error);
    })
  })
}

// 分片上传
const partUpload = async (args) => {
  const { part, object, partNumber, uploadId } = args
  // 分片上传接口地址
  const partUploadArgs = `${object}?partNumber=${partNumber}&uploadId=${uploadId}`
  // 获取签名
  const res = await getSTCSignHandle('PUT', partUploadArgs);
  // console.log('请求签名结果', JSON.stringify(res.data))
  globalSign = res.data

  // 根据获取签名时获取到的 object 结合签名信息生成最终的文件服务器地址
  const uploadPartURL = getUploadURL(partUploadArgs)
  // console.log('分片上传文件服务器地址: ', uploadPartURL)

  // 调用分片上传接口
  // 生成对应的 Content-Type
  const type = getFileMimeAsync(fileType)
  const { signature, utcDate } = globalSign
  const header = {
    'Content-type': type || 'text/plain',
    'Authorization': signature,
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-content-sha256': sha256Str,
    'x-amz-expires': '900', // 和服务端统一
    'x-amz-date': utcDate,
  }
  const params = {
    url: uploadPartURL,
    params: {
      part
    },
    header,

  }
  try {
    const res = await putApi(params)
    console.log('当前片上传结果: ', res)
    const eTag = res.headers.etag
    return {
      eTag,
      partNumber
    }
  } catch (error) {
    console.log('上传出错', error)
  }
}

// 组合分片
const postApi2 = ({ url, params, header }) => {
  return new Promise((resolve, reject) => {
    Axios.post(url, params.xml, { headers: header }).then(res => {
      resolve(res.data);
    }).catch(error => {
      reject(error);
    })
  })
}

// 组合分片并结束上传
const completeMultipartUpload = async (url, parts) => {
  const { signature, utcDate } = globalSign

  const elements = []
  parts.map(item => {
    if (item && item.eTag) {
      elements.push(
        {
          type: 'element',
          name: 'Part',
          elements: [{
            type: 'element',
            name: 'ETag',
            elements: [
              {
                type: 'text',
                text: item.eTag
              }
            ]
          }, {
            type: 'element',
            name: 'PartNumber',
            elements: [
              {
                type: 'text',
                text: item.partNumber
              }
            ]
          }]
        }
      )
    }
  })

  const XMLJson = {
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'UTF-8'
      }
    },
    elements: [{
      type: 'element',
      name: 'CompleteMultipartUpload',
      attributes: {
        xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/'
      },
      elements
    }]
  }
  const xmlStr = jsonToXml(XMLJson)

  const params = {
    url,
    params: {
      xml: xmlStr
    },
    header: {
      // ...header,
      'Content-type': 'text/xml',
      'Authorization': signature,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-content-sha256': sha256Str,
      'x-amz-expires': '900', // 和服务端统一
      'x-amz-date': utcDate
    }
  }
  console.log('组合分片的参数: ', JSON.stringify(params))
  let res = await postApi2(params)
  return res
}


// 上传
const upload = async () => {
  /**
   * 1. 获取签名
   *    1. 获取 object。
   *    2. 调用获取签名接口。
   *      1. 参数1: PUT (创建上传接口的请求方式) 
   *         参数2: uploads (创建上传需要的必要参数) 
   * 2. 创建上传
   *    1. 根据获取签名时获取到的 object 结合签名信息生成最终的文件服务器地址
   *    2. 根据 1 生成的地址结合 uploads 生成创建上传的接口地址
   *    3. 获取签名时传入的接口类型就是创建上传的接口类型
   *    4. 调用接口
   * 3. 分片上传
   *    1. 计算分片并拿到文件读取的分片结果
   *    2. 遍历分片结果进行分片上传
   *    3. 期间有几率签名失效，需要重新获取签名
   * 4. 组合分片
   */
  const object = getObject(fileName)
  // 创建上传时需要传入的参数
  const args = `${object}?uploads`
  // 1. 获取签名
  const res = await getSTCSignHandle('POST', args);
  console.log('请求签名结果', JSON.stringify(res.data))
  globalSign = res.data

  // 根据获取签名时获取到的 object 结合签名信息生成最终的文件服务器地址
  const fileServer = getUploadURL(object)
  console.log('文件服务器地址: ', fileServer)

  // 2. 创建上传
  const createUploadRes = await createUploadHandle(args)
  console.log('创建上传接口返回结果: ', JSON.stringify(createUploadRes.data))

  // 3.1 计算分片并读取
  const partList = await computeHandle()
  console.log('文件读取结果: ', partList)

  const uploadId = createUploadRes.data.uploadId
  const partPromises = []
  // 3.2 遍历分片结果进行分片上传
  partList.forEach(item => {
    const params = {
      partNumber: item.partNumber,
      // 获取 uploadId, 是在创建上传接口返回的值
      uploadId,
      object,
      part: item.part
    }
    partPromises.push(partUpload(params))
  })

  let parts = []
  try {
    parts = await Promise.all(partPromises)
    console.log('所有分片上传完成', parts)
  } catch (error) {
    console.error('分片上传失败', error)
  }

  // 4. 组合分片
  const completePartArgs = `${object}?uploadId=${uploadId}`
  const completePartSign = await getSTCSignHandle('POST', completePartArgs);
  console.log('组合分片请求签名结果', JSON.stringify(completePartSign.data))
  globalSign = completePartSign.data

  // 根据获取签名时获取到的 object 结合签名信息生成组合分片接口地址
  const completePartURL = getUploadURL(completePartArgs)
  console.log('组合分片接口: ', completePartURL)

  const completeRes = await completeMultipartUpload(completePartURL, parts)
  console.log('组合分片完成: ', completeRes)
}

upload()














// 该计算分片啦~