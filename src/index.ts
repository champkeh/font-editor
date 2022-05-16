import {
    resetFileOffset,
    readUInt16BE,
    readInt16BE,
    readUInt32BE,
    readBuffer,
    readBigInt64BE,
    getFileOffset,
    checkFileOffset
} from './utils.js'
import {
    DirectoryEntry,
    HeadTable,
    HheaTable,
    LocaTable,
    MaxpTable,
    OffsetSubTable,
    ParsedFont,
    Tables
} from "../types/ParsedFont"
import moment from "moment"


/**
 * 解析ttf字体
 * @param data 字体文件内容
 */
export function parseTtf(data: Buffer): ParsedFont {
    // 解析之前，重置文件偏移
    resetFileOffset()

    // offset
    const offset = parseOffsetSubTable(data)

    // table directory
    const directory = parseTableDirectory(data, offset.numTables)

    // table data
    const tables = parseTableData(data, directory)

    return {
        offset,
        directory,
        tables,
    }
}

/**
 * 提取 offset 子表
 * @param data 字体数据
 */
function parseOffsetSubTable(data: Buffer): OffsetSubTable {
    const scalerType = readUInt32BE(data)
    if (scalerType !== 0x00010000 && scalerType !== 0x74727565) {
        throw new Error('该字体不是ttf字体')
    }

    const numTables = readUInt16BE(data)
    const searchRange = readUInt16BE(data)
    const entrySelector = readUInt16BE(data)
    const rangeShift = readUInt16BE(data)

    return {
        scalerType,
        numTables,
        searchRange,
        entrySelector,
        rangeShift,
        _blockSize: getFileOffset(),
    }
}

/**
 * 提取 font directory
 * @param data 字体数据
 * @param numTables 表格数
 */
function parseTableDirectory(data: Buffer, numTables: number): DirectoryEntry[] {
    const directory: DirectoryEntry[] = []
    for (let i = 0; i < numTables; i++) {
        let blockStart = getFileOffset()
        const tag = readBuffer(data, 4).toString("ascii")
        const checksum = readUInt32BE(data)
        const offset = readUInt32BE(data)
        const length = readUInt32BE(data)
        directory.push({
            tag,
            checksum,
            offset,
            length,
            _blockSize: getFileOffset() - blockStart,
            _pad: (4 - (length % 4)) % 4,
        })
    }
    return directory
}

/**
 * 提取 table 数据
 * @param data 字体文件数据
 * @param directory 表目录
 */
function parseTableData(data: Buffer, directory: DirectoryEntry[]): Tables {
    // 对 directory 排序
    directory.sort((a, b) => a.offset > b.offset ? 1 : -1)

    const tables: Tables = {}
    for (let i = 0; i < directory.length; i++) {
        const table = directory[i]
        checkFileOffset(table)
        if (table.tag === 'hhea') {
            tables.hhea = parseHheaTable(data, table, tables)
        } else if (table.tag === 'head') {
            tables.head = parseHeadTable(data, table, tables)
        } else if (table.tag === 'maxp') {
            tables.maxp = parseMaxpTable(data, table, tables)
        } else if (table.tag === 'loca') {
            tables.loca = parseLocaTable(data, table, tables)
        } else {
            // 暂未实现的表
            readBuffer(data, table.length)
        }

        // handle table padding
        readBuffer(data, table._pad)
    }

    return tables
}

/**
 * 解析 'hhea' 表
 * @param data 字体数据
 * @param table 该表的元数据
 * @param tables 已解析的tables
 */
function parseHheaTable(data: Buffer, table: DirectoryEntry, tables: Tables): HheaTable {
    const major = readInt16BE(data)
    const minor = readInt16BE(data)
    const version = `${major}.${minor}`

    const ascent = readInt16BE(data)
    const descent = readInt16BE(data)
    const lineGap = readInt16BE(data)
    const advanceWidthMax = readUInt16BE(data)
    const minLeftSideBearing = readInt16BE(data)
    const minRightSideBearing = readInt16BE(data)
    const xMaxExtent = readInt16BE(data)
    const caretSlopeRise = readInt16BE(data)
    const caretSlopeRun = readInt16BE(data)
    const caretOffset = readInt16BE(data)
    const reserved = readBuffer(data, 8)
    const metricDataFormat = readInt16BE(data)
    const numOfLongHorMetrics = readUInt16BE(data)

    return {
        version,
        ascent,
        descent,
        lineGap,
        advanceWidthMax,
        minLeftSideBearing,
        minRightSideBearing,
        xMaxExtent,
        caretSlopeRise,
        caretSlopeRun,
        caretOffset,
        reserved,
        metricDataFormat,
        numOfLongHorMetrics,
    }
}

/**
 * 解析 'head' 表
 * @param data 字体数据
 * @param table 该表的元数据
 * @param tables 已解析的tables
 */
function parseHeadTable(data: Buffer, table: DirectoryEntry, tables: Tables): HeadTable {
    const versionMajor = readInt16BE(data)
    const versionMinor = readInt16BE(data)
    const version = `${versionMajor}.${versionMinor}`

    const fontRevisionMajor = readInt16BE(data)
    const fontRevisionMinor = readInt16BE(data)
    const fontRevision = `${fontRevisionMajor}.${fontRevisionMinor}`

    const checkSumAdjustment = readUInt32BE(data)
    const magicNumber = readUInt32BE(data)
    const flags = readUInt16BE(data)
    const unitsPerEm = readUInt16BE(data)
    const createdSecond = readBigInt64BE(data)
    const created = moment("1904-01-01").add(createdSecond, 's').format()

    const modifiedSecond = readBigInt64BE(data)
    const modified = moment("1904-01-01").add(modifiedSecond, 's').format()

    const xMin = readInt16BE(data)
    const yMin = readInt16BE(data)
    const xMax = readInt16BE(data)
    const yMax = readInt16BE(data)
    const macStyle = readUInt16BE(data)
    const lowestRecPPEM = readUInt16BE(data)
    const fontDirectionHint = readInt16BE(data)
    const indexToLocFormat = readInt16BE(data) === 0 ? 'short' : 'long'
    const glyphDataFormat = readInt16BE(data)

    return {
        version,
        fontRevision,
        checkSumAdjustment,
        magicNumber,
        flags,
        unitsPerEm,
        created,
        modified,
        xMin,
        yMin,
        xMax,
        yMax,
        macStyle,
        lowestRecPPEM,
        fontDirectionHint,
        indexToLocFormat,
        glyphDataFormat,
    }
}

/**
 * 解析 'maxp' 表
 * @param data 字体数据
 * @param table 该表的元数据
 * @param tables 已解析的tables
 */
function parseMaxpTable(data: Buffer, table: DirectoryEntry, tables: Tables): MaxpTable {
    const major = readInt16BE(data)
    const minor = readInt16BE(data)
    const version = `${major}.${minor}`

    const numGlyphs = readUInt16BE(data)
    const maxPoints = readUInt16BE(data)
    const maxContours = readUInt16BE(data)
    const maxComponentPoints = readUInt16BE(data)
    const maxComponentContours = readUInt16BE(data)
    const maxZones = readUInt16BE(data)
    const maxTwilightPoints = readUInt16BE(data)
    const maxStorage = readUInt16BE(data)
    const maxFunctionDefs = readUInt16BE(data)
    const maxInstructionDefs = readUInt16BE(data)
    const maxStackElements = readUInt16BE(data)
    const maxSizeOfInstructions = readUInt16BE(data)
    const maxComponentElements = readUInt16BE(data)
    const maxComponentDepth = readUInt16BE(data)

    return {
        version,
        numGlyphs,
        maxPoints,
        maxContours,
        maxComponentPoints,
        maxComponentContours,
        maxZones,
        maxTwilightPoints,
        maxStorage,
        maxFunctionDefs,
        maxInstructionDefs,
        maxStackElements,
        maxSizeOfInstructions,
        maxComponentElements,
        maxComponentDepth,
    }
}

/**
 * 解析 'loca' 表
 * @param data 字体数据
 * @param table 该表的元数据
 * @param tables 已解析的tables
 */
function parseLocaTable(data: Buffer, table: DirectoryEntry, tables: Tables): LocaTable {
    const locas: LocaTable = []

    let previousGlyphsOffset = 0
    const numGlyphs = tables.maxp!.numGlyphs!
    for (let i = 0; i < numGlyphs + 1; i++) {
        let glyphsOffset = 0
        if (tables.head!.indexToLocFormat === 'short') {
            glyphsOffset = readUInt16BE(data) * 2
        } else {
            glyphsOffset = readUInt32BE(data)
        }

        if (i > 0) {
            locas.push({
                offset: previousGlyphsOffset,
                _length: glyphsOffset - previousGlyphsOffset,
                _index: i - 1,
            })
        }
        previousGlyphsOffset = glyphsOffset
    }
    return locas
}
