const { basename, extname } = require('path')
const { filePath, getObject, context, ver, s3Header } = require('./config/index')
const { getSTCSignHandle, postApi, getApi, putApi, postApi2 } = require('./api/index')
const { computeHandle, getFileMimeAsync, xmlToJson, jsonToXml } = require('./util/index')

const fileName = basename(filePath)
const fileType = extname(fileName)
let globalSign = null

let uploadMax = 3; // 上传时最大切片的个数
const cancels = []; // 存储要取消的请求
const tempFilesArr = []; // 所选中的所有文件信息，处理过之后的（增加了很多字段）。

// 每个格式化之后的文件对象中应该有什么
const tempFileObj = {
  createUploadIsError: false, // 创建上传接口是否失败
  statusStr: '正在上传', // 上传状态提示
  chunkList: [], // 分片 list
  uploadProgress: 0, // 上传进度
  hashProgress: 0, // 
}

const getUploadURL = (object) => {
  const { protocol, endpoint, bucket } = globalSign
  return `${protocol}://${endpoint}/${bucket}${object}`
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
    ...s3Header,
    'Content-type': type || 'text/plain',
    'Authorization': signature,
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
    ...s3Header,
    'Content-type': type || 'text/plain',
    'Authorization': signature,
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
    const eTag = res.headers.etag
    console.log('当前片上传成功: ', res.headers.etag)
    return {
      eTag,
      partNumber
    }
  } catch (error) {
    console.log('上传出错', error)
  }
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
      ...s3Header,
      'Content-type': 'text/xml',
      'Authorization': signature,
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
   *      1. 创建上传
   *          参数1: POST (接口的请求方式) 
   *          参数2: uploads (创建上传需要的必要参数) 
   *      2. 分片上传
   *          参数1: PUT (接口的请求方式) 
   *          参数2: `${object}?partNumber=${partNumber}&uploadId=${uploadId}` (创建上传需要的必要参数) 
   *      3. 组合分片
   *          参数1: POST (接口的请求方式) 
   *          参数2: `${object}?uploadId=${uploadId}` (创建上传需要的必要参数) 
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
  const partList = await computeHandle(filePath)
  // console.log('文件读取结果: ', partList)
  console.log('文件读取完毕，准备上传 ===>')

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