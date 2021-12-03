const Axios = require('axios')
const { getSignURL, s3Header, baseHeader, sha256Str } = require('../config/index')

// 组合分片 combinedShards
const postApi2 = ({ url, params, header }) => {
  return new Promise((resolve, reject) => {
    Axios.post(url, params.xml, { headers: header }).then(res => {
      resolve(res.data);
    }).catch(error => {
      reject(error);
    })
  })
}


// put 请求
const putApi = ({ url, params, header }) => {
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


// post 请求
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

const getApi = ({ url, method, object }) => {
  return new Promise((resolve, reject) => {
    Axios.get(url, {
      params: {
        method,
        object
      },
      headers: {
        ...baseHeader,
        ...s3Header
      },
    }).then(res => {
      resolve(res.data);
    }).catch(error => {
      reject(error);
    })
  })
}

/**
 * 获取 STC 签名
 * @param method STC 的请求方法
 * @param object STC 的 object 就是 url + 参数
 */
 const getSTCSignHandle = async (method, object) => {
  // 上传接口地址
  const config = {
    url: getSignURL,
    object,
    method
  }
  const res = await getApi(config)
  return res
}

module.exports = {
  getSTCSignHandle,
  getApi,
  postApi2,
  postApi,
  putApi
}