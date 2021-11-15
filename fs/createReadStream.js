const fs = require('fs')
// ---------------------------- 读取文件 ----------------------------
// 创建读取流
const readStream = fs.createReadStream('./assets/test.txt')

// 读取次数
let count = 0
// 读取到的数据
let str = ''

// 监听读取数据
readStream.on('data', data => {
  str += data
  count++
})
// 读取完毕
readStream.on('end', () => {
  console.log(str)
  console.log(count)
})
// 读取失败
readStream.on('error', (err) => {
  console.log(err)
})