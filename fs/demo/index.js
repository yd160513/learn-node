// 需求: 1. 判断服务器上面是否有 upload 目录，如果没有则创建这个目录，如果有的话不做操作
// 这个功能可以利用 mkdirp 包来完成
const mkdirp = require('mkdirp')
const fs = require('fs')

// const folder = './upload'
// // 判断 upload 是否存在，但是无法区分是文件还是目录
// fs.stat(folder, (err, data) => {
//   // 这里报错说明没有 upload 所以要创建 upload 目录
//   if (err) {
//     // 执行创建目录
//     mkdir(folder)
//     return
//   }
//   // 判断是不是目录
//   if (data.isDirectory()) {
//     // 目录存在
//   }
//   // 是文件
//   else {
//     // 将 upload 文件删除
//     fs.unlink(folder, err => {
//       if (err) return console.log(`删除 ${folder} 文件失败`, err)
//       // 执行创建目录
//       mkdir(folder)
//     })
//   }
// })

// // 创建目录
// function mkdir(dir) {
//   fs.mkdir(dir, err => {
//     if (err) return console.log('创建目录失败', err)
//     console.log(`创建 ${dir} 目录成功`)
//   })
// }

// 利用 mkdirp 实现
// mkdirp('./upload').then(res => {
//   console.log(res)
// }).catch(err => {
//   console.log(err)
// })

// 需求: 2. wwwroot 文件夹下面有 img css js 以及 index.html，找出 wwwroot 目录下面所有的目录
const path = './wwwroot'
const dirArr = []
// 读取目录和文件
const dirRes = fs.readdirSync(path)
for (let index = 0; index < dirRes.length; index++) {
  const element = dirRes[index];
  const stat = fs.statSync(`${path}/${element}`)
  if (stat.isDirectory()) {
    dirArr.push(element)
  }
}
console.log(`${path} 目录下的所有目录: ${dirArr}`)
