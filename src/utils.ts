import fs from 'node:fs'
import type {PathLike} from 'node:fs'
import type {Buffer} from 'node:buffer'
import type {ParsedFont, OffsetSubTable, DirectoryEntry} from '../types/ParsedFont'

/**
 * 读取文件内容
 * @param path
 */
export function readFile(path: PathLike | number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const buf = fs.readFileSync(path)
            resolve(buf)
        } catch (e) {
            reject(e)
        }
    })
}

/**
 * 解析ttf字体
 * @param data 字体文件内容
 */
export function parseTtf(data: Buffer): ParsedFont {
    let fileOffset = 0

    const scalerType = data.readUInt32BE(fileOffset)
    if (scalerType !== 0x00010000 && scalerType !== 0x74727565) {
        throw new Error('该字体不是ttf字体')
    }
    fileOffset += 4

    const numTables = data.readUInt16BE(fileOffset)
    fileOffset += 2

    const searchRange = data.readUInt16BE(fileOffset)
    fileOffset += 2

    const entrySelector = data.readUInt16BE(fileOffset)
    fileOffset += 2

    const rangeShift = data.readUInt16BE(fileOffset)
    fileOffset += 2

    const offset: OffsetSubTable = {
        scalerType,
        numTables,
        searchRange,
        entrySelector,
        rangeShift,
        _blockSize: fileOffset,
    }
    const directory: DirectoryEntry[] = []

    // table directory
    for (let i = 0; i < numTables; i++) {
        let blockStart = fileOffset
        const tag = data.slice(fileOffset, fileOffset + 4).toString("ascii")
        fileOffset += 4
        const checksum = data.readUInt32BE(fileOffset)
        fileOffset += 4
        const offset = data.readUInt32BE(fileOffset)
        fileOffset += 4
        const length = data.readUInt32BE(fileOffset)
        fileOffset += 4
        directory.push({
            tag,
            checksum,
            offset,
            length,
            _blockSize: fileOffset - blockStart,
            _pad: (4 - (length % 4)) % 4,
        })
    }

    return {
        offset,
        directory,
    }
}
