function formatNumber (n) {
  const str = n.toString()
  return str[1] ? str : `0${str}`
}

export function formatTime (date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const t1 = [year, month, day].map(formatNumber).join('/')
  const t2 = [hour, minute, second].map(formatNumber).join(':')

  return `${t1} ${t2}`
}

/**
 * arr 要查询的数组、key 要查询对象的属性、 要查询的值
 * 判断某个值是否在数组中，并返回位置
 * */
export function inArray (arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty(key)) {
      if (arr[i][key] === val) {
        return i
      }
    }
  }
  return -1
}

// ArrayBuffer转16进度字符串示例
export function ab2hex (buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}

export default {
  formatNumber,
  formatTime,
  inArray,
  ab2hex
}
