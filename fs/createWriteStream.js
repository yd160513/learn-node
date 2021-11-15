const fs = require('fs')
// ---------------------------- 写入文件 ----------------------------
const data = `我是被写入的数据 - ${Date.now()}`
// 创建写入流
const writeStram = fs.createWriteStream('./assets/test_2.txt')
// 写入数据
writeStram.write(data)
// 标记写入完成
writeStram.end()
// 监听写入完成
writeStram.on('finish', () => {
  console.log('写入完成')
})