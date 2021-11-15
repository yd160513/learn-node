const fs = require('fs')

/**
 * 1. fs.stat 检测是文件还是目录
 * 2. mkdir 创建目录
 */

// 删除文件
fs.unlink('./test/newTest.js', (err) => {
  if (err) return console.log('删除文件失败', err)
  console.log('删除文件成功')
})

/**
 * 删除目录
 * 1. 如果目录下有文件的话是删除不掉的
 *    需要读取到该目录下的所有文件，先把文件删除再删除目录
 * 2. 不可以直接: fs.rmdir('./test/test.js', err => {}) 这样会直接报错，因为删除文件需要使用 fs.unlink()
 */
fs.rmdir('./test', err => {
  if (err) return console.log('删除目录失败', err)
  console.log('删除目录成功')
})

/**
 * rename: 
 *  1. 重命名
 *  2. 移动文件
 */
// 1. 重命名
fs.rename('./test.js', './newTest.js', err => {
  if (err) return console.log('重命名文件失败', err)
  console.log('重命名文件成功')
})
// 2. 移动文件 移动到一个新的文件夹的时候，如果这个文件夹不存在则会移动失败
//    移动的同时也可以重命名
fs.rename('./test.js', './test/newTest.js', err => {
  if (err) return console.log('移动文件失败', err)
  console.log('移动文件成功')
})

// 读取目录，可以读取到当前目录下的文件和目录，返回一个数组。
fs.readdir('.', (err, data) => {
  if (err) return console.log('读取目录失败', err)
  console.log('读取目录成功 =>', data)
})

/**
 * 读取文件
 * 读到的默认是 Buffer，可调用 buffer.toString() 方法
 */
fs.readFile('./html/index.html', (err, data) => {
  if (err) return console.log('读取文件失败', err)
  console.log('buffer =>', data)
  console.log('toString() =>', data.toString())
})

// 追加文件， 对之前的文件进行追加， 如果不存在则创建这个文件
fs.appendFile('./css/base.css', 'h2 { color: blue }', err => {
  if (err) return console.log('追加写入失败', err)
  console.log('追加写入成功')
})

/**
 * 创建写入文件，如果这个文件不存在则会创建，如果已经存在则会替换这个文件
 * 第三个参数也可以传入 options， 则第四个参数是 callback
 */
fs.writeFile('./html/index.html', '你好 nodejs，哈哈哈', err => {
  if (err) return console.log('创建写入失败', err)
  console.log('创建写入成功')
})

//  
/**
 * 创建目录。如果当前目录下已经存在则会报错
 * 第二个参数也可以传入 options， 则第三个参数是 callback
 */
fs.mkdir('./css', (err) => {
  if (err) return console.log('创建失败', err)
  console.log('创建成功')
})

// 检测是文件还是目录
fs.stat('./index.js', (err, data) => {
  if (err) return console.log('检测失败', err)
  console.log(`是文件: ${data.isFile()}`)
  console.log(`是目录: ${data.isDirectory()}`)
})