import {FileBuffer, parseTtf} from '../../dist/index.esm.js'

document.getElementById('file').addEventListener('change', (evt) => {
    const file = evt.target.files[0]
    const reader = new FileReader()
    reader.onload = function (evt) {
        const buffer = evt.target.result
        const file = new FileBuffer(buffer)
        const result = parseTtf(file)
        console.log(result)
    }
    reader.readAsArrayBuffer(file)
})
