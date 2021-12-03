const { json2xml, xml2json } = require('xml-js')
const mime = require('mime-types')
const { createReadStream, statSync } = require('fs')

// 分片读取文件
const getPartFile = (filePath, startPos, endPos) => {
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

/**
 * 分片处理
 * @param {number} startByte 分片开始的位置，默认是第 0 个字节
 * @returns endByte 分片结束的位置
 */
const fragmentationHandle = async (filePath, fileSize, chunkSize, startByte = 0, partList = []) => {
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
  const part = await getPartFile(filePath, startByte, endByte)
  partList.push({
    partNumber,
    part
  })
  console.log(`${startByte}-${endByte}读取结束! 长度为: ${part.length}`)
  return fragmentationHandle(filePath, fileSize, chunkSize, endByte, partList)
}

// 分片计算
const computeHandle = async (filePath) => {
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
  const res = await fragmentationHandle(filePath, fileSize, chunkSize)
  return res
}

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

module.exports = {
  computeHandle,
  getPartFile,
  jsonToXml,
  xmlToJson,
  getFileMimeAsync
}