import {
    CmapEncodingSubtable,
    CmapFormat12Group,
    CompoundGlyfData,
    DirectoryEntry,
    GlyfFlag,
    NameRecord,
    SimpleGlyfData
} from "../types"
import {
    UnicodeEncodingIDMap,
    MacintoshEncodingIDMap,
    WindowsEncodingIDMap,
    PlatformIDMap,
    WindowsLanguageIDMap,
    MacintoshLanguageIDMap,
    NameIDMap
} from './map'
import {IFileBuffer} from "../IFileBuffer"


/**
 * 解析 'name' 表中的 name 字符串
 * @param data
 * @param record
 */
export function parseNameStringInPlace(data: IFileBuffer, record: NameRecord) {
    // 解析 platformID
    record._platform = PlatformIDMap[record.platformID] || 'unknown'
    record._name = NameIDMap[record.nameID] || 'unknown'

    switch (record.platformID) {
        case 0:
            // Unicode platform
            record._encoding = UnicodeEncodingIDMap[record.encodingID] || 'unknown'
            record._value = data.toString("utf16be")
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
            record._value = data.toString("utf16be")
            break
        default:
            record._value = data.toString('ascii')
            break
    }
}

/**
 * 解析 'glyf' 表中的字型数据
 * @param file
 * @param numberOfContours 该字型的轮廓数
 * @param glyfLen
 */
export function parseGlyfData(file: IFileBuffer, numberOfContours: number, glyfLen: number): SimpleGlyfData | CompoundGlyfData {
    if (numberOfContours >= 0) {
        const endPtsOfContours: number[] = []
        for (let i = 0; i < numberOfContours; i++) {
            endPtsOfContours.push(file.readUInt16BE())
        }
        // console.log(endPtsOfContours)

        const instructionLength = file.readUInt16BE()
        const instructions = file.readBuffer(instructionLength)
        // console.log('instructionLength: ', instructionLength)

        // const flags = []
        // let flagIdx = 0
        // for (let i = 0; i < numberOfContours; i++) {
        //     let j = 0
        //     do {
        //         const flag = parseGlyfFlag(file.readUInt8(), flagIdx++)
        //         j++
        //         flags.push(flag)
        //
        //         if (flag.repeat) {
        //             const repeatCount = file.readUInt8()
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
        //         xCoord = file.readUInt8()
        //     } else {
        //         xCoord = file.readInt16BE()
        //     }
        //     xCoordinates.push(xCoord)
        // })
        // flags.forEach(flag => {
        //     let yCoord
        //     if (flag.yShortVector) {
        //         yCoord = file.readUInt8()
        //     } else {
        //         yCoord = file.readInt16BE()
        //     }
        //     yCoordinates.push(yCoord)
        // })
        // console.log(xCoordinates, yCoordinates)
        return {
            endPtsOfContours,
            instructionLength,
            instructions,
            remind: file.readBuffer(glyfLen - 2*numberOfContours-2-instructionLength),
        }
    } else {
        return file.readBuffer(glyfLen)
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
export function parseCmapSubtablesInPlace(file: IFileBuffer, tableDesc: DirectoryEntry, subtables: CmapEncodingSubtable[]) {
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

        file.setFileOffset(tableDesc.offset + offset)

        subtable.format = file.readUInt16BE()
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
function parseCmapFormat0(file: IFileBuffer, subtable: CmapEncodingSubtable) {
    const length = file.readUInt16BE()
    const language = file.readInt16BE()
    const glyphIndexArray = Array.from<number>({length: 256})
    for (let i = 0; i < 256; i++) {
        glyphIndexArray[i] = file.readUInt8()
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
function parseCmapFormat4(file: IFileBuffer, subtable: CmapEncodingSubtable) {
    const length = file.readUInt16BE()
    const language = file.readUInt16BE()
    const segCountX2 = file.readUInt16BE()
    const searchRange = file.readUInt16BE()
    const entrySelector = file.readUInt16BE()
    const rangeShift = file.readUInt16BE()
    const segCount = segCountX2 / 2

    const endCode = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        endCode[i] = file.readUInt16BE()
    }

    const reservedPad = file.readUInt16BE()

    const startCode = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        startCode[i] = file.readUInt16BE()
    }

    const idDelta = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        idDelta[i] = file.readUInt16BE()
    }

    const idRangeOffsetStart = file.getFileOffset()
    const idRangeOffset = Array.from<number>({length: segCount})
    for (let i = 0; i < segCount; i++) {
        idRangeOffset[i] = file.readUInt16BE()
    }

    // const glyphIndexArrayLength = length - 22 - segCount * 8
    // const glyphIndexArray = Array.from<number>({length: glyphIndexArrayLength})
    // for (let i = 0; i < glyphIndexArrayLength; i++) {
    //     glyphIndexArray[i] = file.readUInt16BE()
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
                file.setFileOffset(glyphIndexOffset)
                return file.readUInt16BE()
            }
        },
    }
}

/**
 * 解析 cmap format-12
 * @param file
 * @param subtable
 */
function parseCmapFormat12(file: IFileBuffer, subtable: CmapEncodingSubtable) {
    const reserved = file.readUInt16BE()
    const length = file.readUInt32BE()
    const language = file.readUInt32BE()
    const nGroups = file.readUInt32BE()

    const groups: CmapFormat12Group[] = []
    for (let i = 0; i < nGroups; i++) {
        const startCharCode = file.readUInt32BE()
        const endCharCode = file.readUInt32BE()
        const startGlyphCode = file.readUInt32BE()
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
