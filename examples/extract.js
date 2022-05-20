const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const fontCarrier = require('font-carrier')

const originFontFile = '../assets/fonts/DIN_Alternate_Bold.ttf'
const text = '1234567890'
const outputFontFile = './dist/DIN_Alternate_Bold_min'
const fontFamily = 'DinAlternateBold'

function writeFileSync(filePath, contents) {
    mkdirp(path.dirname(filePath)).then(() => fs.writeFileSync(filePath, contents))
}

const transFont = fontCarrier.transfer(path.resolve(__dirname, originFontFile), {})
transFont.min(text)
const out = transFont.output()
Object.keys(out).forEach(key => {
    const fontPath = path.resolve(__dirname, `${outputFontFile}.${key}`)
    writeFileSync(fontPath, out[key])
})
const filename = path.basename(outputFontFile)

// 生成 css 代码
const css = `@font-face {
    font-family: '${fontFamily}';
    src: url('${filename}.eot'); /* 兼容IE9 */
    src: url('${filename}.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('${filename}.woff2') format('woff2'), /* 最新浏览器 */
        url('${filename}.woff') format('woff'), /* 较新浏览器 */
        url('${filename}.ttf')  format('truetype'), /* Safari、Android、iOS */
        url('${filename}.svg#svgFontName') format('svg'); /* 早期iOS */
}`
const cssPath = path.resolve(__dirname, `${outputFontFile}.css`)
writeFileSync(cssPath, css)
console.log('generate css file', cssPath)
