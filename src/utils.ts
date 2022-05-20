import type {PathLike} from 'node:fs'
import fs from 'node:fs'
import moment from "moment"
import {
    CmapEncodingSubtable, CmapFormat12Group,
    CompoundGlyfData,
    DirectoryEntry,
    GlyfFlag,
    NameRecord,
    SimpleGlyfData
} from "../types/ParsedFont"
import {
    UnicodeEncodingIDMap,
    MacintoshEncodingIDMap,
    WindowsEncodingIDMap,
    PlatformIDMap,
    WindowsLanguageIDMap, MacintoshLanguageIDMap, NameIDMap
} from './map'


/**
 * 读取文件内容
 * @param path
 */
export function readFileContent(path: PathLike | number): Promise<Buffer> {
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
 * 字体文件偏移对象
 */
const FileOffset = {
    value: 0,
}

/**
 * 设置文件偏移
 * @param offset 文件偏移
 */
export function setFileOffset(offset: number) {
    FileOffset.value = offset
}

/**
 * 重置文件偏移
 */
export function resetFileOffset() {
    setFileOffset(0)
}

/**
 * 获取当前文件偏移
 */
export function getFileOffset() {
    return FileOffset.value
}

/**
 * 从当前偏移处读取一个 int8 值
 * @param data 原始数据
 */
export function readInt8(data: Buffer): number {
    const value = data.readInt8(FileOffset.value)
    FileOffset.value += 1
    return value
}

/**
 * 从当前偏移处读取一个 uint8 值
 * @param data 原始数据
 */
export function readUInt8(data: Buffer): number {
    const value = data.readUInt8(FileOffset.value)
    FileOffset.value += 1
    return value
}

/**
 * 从当前偏移处读取一个 int16 值
 * @param data 原始数据
 */
export function readInt16BE(data: Buffer): number {
    const value = data.readInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

/**
 * 从当前偏移处读取一个 uint16 值
 * @param data 原始数据
 */
export function readUInt16BE(data: Buffer): number {
    const value = data.readUInt16BE(FileOffset.value)
    FileOffset.value += 2
    return value
}

/**
 * 从当前偏移处读取一个 int32 值
 * @param data 原始数据
 */
export function readInt32BE(data: Buffer): number {
    const value = data.readInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

/**
 * 从当前偏移处读取一个 uint32 值
 * @param data 原始数据
 */
export function readUInt32BE(data: Buffer): number {
    const value = data.readUInt32BE(FileOffset.value)
    FileOffset.value += 4
    return value
}

/**
 * 从当前偏移处读取一个 int64 值
 * @param data 原始数据
 */
export function readBigInt64BE(data: Buffer): number {
    const value = data.readBigInt64BE(FileOffset.value)
    FileOffset.value += 8
    return Number(value)
}

/**
 * 从当前偏移处读取一个 uint64 值
 * @param data 原始数据
 */
export function readBigUInt64BE(data: Buffer): number {
    const value = data.readBigUInt64BE(FileOffset.value)
    FileOffset.value += 8
    return Number(value)
}

/**
 * 从当前偏移处读取一个 FWord 值
 * @param data 原始数据
 */
export function readFWord(data: Buffer): number {
    return readInt16BE(data)
}

/**
 * 从当前偏移处读取一个 UFWord 值
 * @param data 原始数据
 */
export function readUFWord(data: Buffer): number {
    return readUInt16BE(data)
}

/**
 * 从当前偏移处读取指定长度的buf
 * @param data 原始数据
 * @param len 字节数
 */
export function readBuffer(data: Buffer, len: number): Buffer {
    const buf = data.slice(FileOffset.value, FileOffset.value + len)
    FileOffset.value += len
    return buf
}

/**
 * 从当前偏移处读取一个 LongDateTime 值
 * @param data 原始数据
 */
export function readLongDateTime(data: Buffer): string {
    const seconds = readBigInt64BE(data)
    return moment("1904-01-01").add(seconds, 's').format()
}

/**
 * 解析 'name' 表中的 name 字符串
 * @param data
 * @param record
 */
export function parseNameStringInPlace(data: Buffer, record: NameRecord) {
    // 解析 platformID
    record._platform = PlatformIDMap[record.platformID] || 'unknown'
    record._name = NameIDMap[record.nameID] || 'unknown'

    switch (record.platformID) {
        case 0:
            // Unicode platform
            record._encoding = UnicodeEncodingIDMap[record.encodingID] || 'unknown'
            record._value = decodeBufferUtf16BE(data)
            break
        case 1:
            // Macintosh platform
            record._encoding = MacintoshEncodingIDMap[record.encodingID] || 'unknown'
            record._language = MacintoshLanguageIDMap[record.languageID] || 'unknown'
            record._value = data.toString('ascii')
            break
        case 3:
            // Windows platform
            record._encoding = WindowsEncodingIDMap[record.encodingID] || 'unknown'
            record._language = WindowsLanguageIDMap[('0'.repeat(4)+record.languageID.toString(16)).slice(-4)] || 'unknown'
            record._value = decodeBufferUtf16BE(data)
            break
        default:
            record._value = data.toString('ascii')
            break
    }
}

/**
 * 以 UTF-16BE 的方式解码数据
 * @param data
 */
function decodeBufferUtf16BE(data: Buffer): string {
    const buf = Buffer.from(new Uint8Array(data.length))
    for (let i = 0, len = data.length / 2; i < len; i++) {
        const val = data.readUInt16BE(i*2)
        buf.writeUInt16BE((val>>8) | (val<<8 & 0xFFFF), i*2)
    }
    return buf.toString('utf16le')
}

/**
 * 解析 'glyf' 表中的字型数据
 * @param file
 * @param numberOfContours 该字型的轮廓数
 * @param glyfLen
 */
export function parseGlyfData(file: Buffer, numberOfContours: number, glyfLen: number): SimpleGlyfData | CompoundGlyfData {
    if (numberOfContours >= 0) {
        const endPtsOfContours: number[] = []
        for (let i = 0; i < numberOfContours; i++) {
            endPtsOfContours.push(readUInt16BE(file))
        }
        // console.log(endPtsOfContours)

        const instructionLength = readUInt16BE(file)
        const instructions = readBuffer(file, instructionLength)
        // console.log('instructionLength: ', instructionLength)

        // const flags = []
        // let flagIdx = 0
        // for (let i = 0; i < numberOfContours; i++) {
        //     let j = 0
        //     do {
        //         const flag = parseGlyfFlag(readUInt8(file), flagIdx++)
        //         j++
        //         flags.push(flag)
        //
        //         if (flag.repeat) {
        //             const repeatCount = readUInt8(file)
        //             flag._repeat = repeatCount
        //
        //             j += repeatCount
        //             for (let k = 0; k < repeatCount; k++) {
        //                 flags.push({
        //                     ...flag,
        //                     repeat: false,
        //                     _index: flagIdx++,
        //                     _copy: true,
        //                     _repeat: undefined,
        //                 })
        //             }
        //         }
        //     } while (j <= endPtsOfContours[i])
        // }

        // console.log(flags)
        // readBuffer(file, glyfLen - 2*numberOfContours-2-instructionLength-flags.length)

        // const xCoordinates: number[] = []
        // const yCoordinates: number[] = []
        // flags.forEach(flag => {
        //     let xCoord
        //     if (flag.xShortVector) {
        //         xCoord = readUInt8(file)
        //     } else {
        //         xCoord = readInt16BE(file)
        //     }
        //     xCoordinates.push(xCoord)
        // })
        // flags.forEach(flag => {
        //     let yCoord
        //     if (flag.yShortVector) {
        //         yCoord = readUInt8(file)
        //     } else {
        //         yCoord = readInt16BE(file)
        //     }
        //     yCoordinates.push(yCoord)
        // })
        // console.log(xCoordinates, yCoordinates)
        return {
            endPtsOfContours,
            instructionLength,
            instructions,
            remind: readBuffer(file, glyfLen - 2*numberOfContours-2-instructionLength),
        }
    } else {
        return readBuffer(file, glyfLen)
    }
}

function parseGlyfFlag(bits: number, index: number): GlyfFlag {
    bits &= 0xFF

    return {
        onCurve: (bits & 1) === 1,
        xShortVector: (bits >> 1 & 1) === 1,
        yShortVector: (bits >> 2 & 1) === 1,
        repeat: (bits >> 3 & 1) === 1,
        xSame: (bits >> 4 & 1) === 1,
        ySame: (bits >> 5 & 1) === 1,
        _index: index,
        _bits: ('0'.repeat(8) + bits.toString(2)).slice(-8),
    }
}

/**
 * 解析 cmap 编码子表
 * @param file
 * @param tableDesc
 * @param subtables
 */
export function parseCmapSubtablesInPlace(file: Buffer, tableDesc: DirectoryEntry, subtables: CmapEncodingSubtable[]) {
    subtables.forEach(subtable => {
        const { platformID, encodingID, offset } = subtable

        subtable._platform = PlatformIDMap[platformID] || 'unknown'
        switch (platformID) {
            case 0:
                // Unicode platform
                subtable._encoding = UnicodeEncodingIDMap[encodingID] || 'unknown'
                break
            case 1:
                // Macintosh platform
                subtable._encoding = MacintoshEncodingIDMap[encodingID] || 'unknown'
                break
            case 3:
                // Windows platform
                subtable._encoding = WindowsEncodingIDMap[encodingID] || 'unknown'
                break
        }

        setFileOffset(tableDesc.offset + offset)

        subtable.format = readUInt16BE(file)
        switch (subtable.format) {
            case 0:
                parseCmapFormat0(file, subtable)
                break
            case 2:
                break
            case 4:
                parseCmapFormat4(file, subtable)
                break
            case 6:
                break
            case 8:
                break
            case 10:
                break
            case 12:
                parseCmapFormat12(file, subtable)
                break
            case 13:
                break
            case 14:
                break
        }
    })
}

/**
 * 确定使用哪个 cmap 编码子表的偏移
 * @param subtables
 */
export function resolveCmapSubtable(subtables: CmapEncodingSubtable[]): number {
    // 优先判断 UCS-4
    const ucs4 = subtables.find(s => s._encoding?.includes('UCS-4'))
    if (ucs4) {
        return ucs4.offset
    }

    // 判断是否存在 BMP only 子表
    const ucs2 = subtables.find(s => s._encoding?.includes('BMP'))
    if (ucs2) {
        return ucs2.offset
    }

    // 最后，随便选择一个返回
    return subtables[0].offset
}

/**
 * 解析 cmap format-0
 */
function parseCmapFormat0(file: Buffer, subtable: CmapEncodingSubtable) {
    const length = readUInt16BE(file)
    const language = readInt16BE(file)
    const glyphIndexArray = Array.from<number>({length: 256})
    for (let i = 0; i < 256; i++) {
        glyphIndexArray[i] = readUInt8(file)
    }

    subtable._data = {
        format: 0,
        length,
        language,
        glyphIndexArray,
        getGlyphIndex(code: number): number {
            if (code < 0 || code > 255) {
                return 0
            }
            return glyphIndexArray[code]
        }
    }
}

/**
 * 解析 cmap format-4
 * @param file
 * @param subtable
 */
function parseCmapFormat4(file: Buffer, subtable: CmapEncodingSubtable) {
    const length = readUInt16BE(file)
    const language = readUInt16BE(file)
    const segCountX2 = readUInt16BE(file)
    const searchRange = readUInt16BE(file)
    const entrySelector = readUInt16BE(file)
    const rangeShift = readUInt16BE(file)
    const segCount = segCountX2 / 2

    const endCode = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        endCode[i] = readUInt16BE(file)
    }

    const reservedPad = readUInt16BE(file)

    const startCode = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        startCode[i] = readUInt16BE(file)
    }

    const idDelta = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        idDelta[i] = readUInt16BE(file)
    }

    const idRangeOffsetStart = getFileOffset()
    const idRangeOffset = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        idRangeOffset[i] = readUInt16BE(file)
    }

    // const glyphIndexArrayLength = length - 22 - segCount * 8
    // const glyphIndexArray = Array.from<number>({length: glyphIndexArrayLength})
    // for (let i = 0; i < glyphIndexArrayLength; i++) {
    //     glyphIndexArray[i] = readUInt16BE(file)
    // }

    subtable._data = {
        format: 4,
        length,
        language,
        segCountX2,
        searchRange,
        entrySelector,
        rangeShift,
        endCode,
        reservedPad,
        startCode,
        idDelta,
        idRangeOffset,
        // glyphIndexArray,
        getGlyphIndex(code: number): number {
            // 找到段 segment
            let segId
            for (let i = 0, len = endCode.length; i < len; i++) {
                if (code >= startCode[i] && code <= endCode[i] ) {
                    segId = i
                    break
                }
            }
            if (segId === undefined) {
                return 0
            }

            if (idRangeOffset[segId] === 0) {
                return code + idDelta[segId]
            } else {
                // 需要使用 glyphIndexArray 来确定最终的 glyphIndex
                const glyphIndexOffset = (idRangeOffsetStart + 2 * segId) + idRangeOffset[segId] + (code - startCode[segId]) * 2
                setFileOffset(glyphIndexOffset)
                return readUInt16BE(file)
            }
        },
    }
}

/**
 * 解析 cmap format-12
 * @param file
 * @param subtable
 */
function parseCmapFormat12(file: Buffer, subtable: CmapEncodingSubtable) {
    const reserved = readUInt16BE(file)
    const length = readUInt32BE(file)
    const language = readUInt32BE(file)
    const nGroups = readUInt32BE(file)

    const groups: CmapFormat12Group[] = []
    for (let i = 0; i < nGroups; i++) {
        const startCharCode = readUInt32BE(file)
        const endCharCode = readUInt32BE(file)
        const startGlyphCode = readUInt32BE(file)
        groups.push({
            startCharCode,
            endCharCode,
            startGlyphCode,
        })
    }

    subtable._data = {
        format: 12,
        reserved,
        length,
        language,
        nGroups,
        groups,
        getGlyphIndex(code: number): number {
            // 找到目标分组 group
            let group
            for (let i = 0; i < nGroups; i++) {
                if (code >= groups[i].startCharCode && code <= groups[i].endCharCode ) {
                    group = groups[i]
                    break
                }
            }
            if (group === undefined) {
                return 0
            }
            return group.startGlyphCode + (code - group.startCharCode)
        }
    }
}
