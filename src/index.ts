const path = require('node:path')
import {readFile, parseTtf} from './utils.js'

const font1 = path.resolve(__dirname, '../assets/fonts/ShouXieTi.ttf')
const font2 = path.resolve(__dirname, '../assets/fonts/DIN_Alternate_Bold.ttf')

readFile(font1).then(data => {
    console.log(data)
    const fontObject = parseTtf(data)
    console.log(fontObject)
    const tableSize = fontObject.directory.reduce((sum, item) => {
        return sum + item.length + item._pad + item._blockSize
    }, 0)
    console.log(tableSize + fontObject.offset._blockSize!)
})

