# 简单上传流程

1. 获取签名
   1. 获取 object
   2. 传入参数: 
      1. method: put (上传文件时的接口类型)
      2. uploadId: '' (分片上传时需要传入的 id)
      3. partNumber: '' (分片数量)
      4. uploads: 'uploads' (初始化上传的时候默认参数)
2. 上传文件
   1. put 接口

# 分片上传流程

1. 获取签名
2. 创建上传
3. 分片上传
4. 组合分片

# 上传 demo

1. 上传到第三方服务器可直接在编辑器中 debug 的 demo: uploadToThirdPartyServer-debug.js
2. nodemon app.js 启动之后可以访问到的 demo
   - / 根目录下是上传到第三方服务的 demo
   
   - /upload 是上传到自己的 node server 的 demo
   
     