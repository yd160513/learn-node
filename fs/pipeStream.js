const fs = require('fs')
// ---------------------------- 管道流 ----------------------------
// 创建一个读取流
const readstream = fs.createReadStream('./assets/max-image.jpg')
// 创建一个写入流
const writeStram = fs.createWriteStream('./test/max-image.jpg')

// 将 readstream 写入到 writeStram
readstream.pipe(writeStram)