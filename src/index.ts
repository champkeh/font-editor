import {
    readUInt16BE,
    readInt16BE,
    readUInt32BE,
    readBuffer,
    getFileOffset,
    readLongDateTime,
    readFWord,
    setFileOffset,
    parseNameStringInPlace
} from './utils'
import {
    DirectoryEntry, DirectoryOffsetSubTable, DirectoryTable, GlyfTable,
    HeadTable,
    HheaTable, HmtxTable,
    LocaTable,
    MaxpTable, NameRecord, NameTable,
    ParsedFont,
    Tables, TableTagNameMap
} from "../types/ParsedFont"


/**
 * 解析ttf字体
 * @param file 字体文件内容
 */
export function parseTtf(file: Buffer): ParsedFont {
    // directory table
    const directory = parseDirectoryTable(file)

    // table data
    const tables = parseTableData(file, directory.entries)

    return {
        directory,
        tables,
    }
}

/**
 * 解析字体的 directory 表
 * @param file
 */
function parseDirectoryTable(file: Buffer): DirectoryTable {
    setFileOffset(0)

    // directory offset
    const offset = parseDirectoryOffset(file)

    // directory entries
    const entries = parseDirectoryEntries(file, offset.numTables)

    return {
        offset,
        entries,
    }
}

/**
 * 提取 directory offset 子表
 * @param file 字体数据
 */
function parseDirectoryOffset(file: Buffer): DirectoryOffsetSubTable {
    const scalerType = readUInt32BE(file)
    if (scalerType !== 0x00010000 && scalerType !== 0x74727565) {
        throw new Error('该字体不是ttf字体')
    }

    const numTables = readUInt16BE(file)
    const searchRange = readUInt16BE(file)
    const entrySelector = readUInt16BE(file)
    const rangeShift = readUInt16BE(file)

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
 * 提取 directory entries 数组
 * @param file 字体数据
 * @param numTables 表格数
 */
function parseDirectoryEntries(file: Buffer, numTables: number): DirectoryEntry[] {
    const entries: DirectoryEntry[] = []
    for (let i = 0; i < numTables; i++) {
        let blockStart = getFileOffset()
        const tag = readBuffer(file, 4).toString("ascii")
        const checksum = readUInt32BE(file)
        const offset = readUInt32BE(file)
        const length = readUInt32BE(file)
        entries.push({
            tag: tag as keyof TableTagNameMap,
            checksum,
            offset,
            length,
            _blockSize: getFileOffset() - blockStart,
            _pad: (4 - (length % 4)) % 4,
        })
    }
    return entries
}

/**
 * 提取 table 数据
 * @param file 字体文件数据
 * @param directory 表目录
 */
function parseTableData(file: Buffer, directory: DirectoryEntry[]): Tables {
    // 对 directory 排序
    directory.sort((a, b) => a.offset > b.offset ? 1 : -1)

    const tables: Tables = {}
    for (let i = 0; i < directory.length; i++) {
        const currentTable = directory[i]

        // 将文件指针指向要解析的表偏移
        setFileOffset(currentTable.offset)

        if (currentTable.tag === 'hhea') {
            tables.hhea = parseHheaTable(file, currentTable, tables)
        } else if (currentTable.tag === 'head') {
            tables.head = parseHeadTable(file, currentTable, tables)
        } else if (currentTable.tag === 'maxp') {
            tables.maxp = parseMaxpTable(file, currentTable, tables)
        } else if (currentTable.tag === 'loca') {
            tables.loca = parseLocaTable(file, currentTable, tables)
        } else if (currentTable.tag === "hmtx") {
            tables.hmtx = parseHmtxTable(file, currentTable, tables)
        } else if (currentTable.tag === "name") {
            tables.name = parseNameTable(file, currentTable, tables)
        } else if (currentTable.tag === "glyf") {
            tables.glyf = parseGlyfTable(file, currentTable, tables)
        }
    }

    return tables
}

/**
 * 解析 'hhea' 表
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseHheaTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): HheaTable {
    const major = readInt16BE(file)
    const minor = readInt16BE(file)
    const version = `${major}.${minor}`

    const ascent = readInt16BE(file)
    const descent = readInt16BE(file)
    const lineGap = readInt16BE(file)
    const advanceWidthMax = readUInt16BE(file)
    const minLeftSideBearing = readInt16BE(file)
    const minRightSideBearing = readInt16BE(file)
    const xMaxExtent = readInt16BE(file)
    const caretSlopeRise = readInt16BE(file)
    const caretSlopeRun = readInt16BE(file)
    const caretOffset = readInt16BE(file)
    const reserved = readBuffer(file, 8)
    const metricDataFormat = readInt16BE(file)
    const numOfLongHorMetrics = readUInt16BE(file)

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
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseHeadTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): HeadTable {
    const versionMajor = readInt16BE(file)
    const versionMinor = readInt16BE(file)
    const version = `${versionMajor}.${versionMinor}`

    const fontRevisionMajor = readInt16BE(file)
    const fontRevisionMinor = readInt16BE(file)
    const fontRevision = `${fontRevisionMajor}.${fontRevisionMinor}`

    const checkSumAdjustment = readUInt32BE(file)
    const magicNumber = readUInt32BE(file)
    const flags = readUInt16BE(file)
    const unitsPerEm = readUInt16BE(file)
    const created = readLongDateTime(file)
    const modified = readLongDateTime(file)
    const xMin = readInt16BE(file)
    const yMin = readInt16BE(file)
    const xMax = readInt16BE(file)
    const yMax = readInt16BE(file)
    const macStyle = readUInt16BE(file)
    const lowestRecPPEM = readUInt16BE(file)
    const fontDirectionHint = readInt16BE(file)
    const indexToLocFormat = readInt16BE(file) === 0 ? 'short' : 'long'
    const glyphDataFormat = readInt16BE(file)

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
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseMaxpTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): MaxpTable {
    const major = readInt16BE(file)
    const minor = readInt16BE(file)
    const version = `${major}.${minor}`

    const numGlyphs = readUInt16BE(file)
    const maxPoints = readUInt16BE(file)
    const maxContours = readUInt16BE(file)
    const maxComponentPoints = readUInt16BE(file)
    const maxComponentContours = readUInt16BE(file)
    const maxZones = readUInt16BE(file)
    const maxTwilightPoints = readUInt16BE(file)
    const maxStorage = readUInt16BE(file)
    const maxFunctionDefs = readUInt16BE(file)
    const maxInstructionDefs = readUInt16BE(file)
    const maxStackElements = readUInt16BE(file)
    const maxSizeOfInstructions = readUInt16BE(file)
    const maxComponentElements = readUInt16BE(file)
    const maxComponentDepth = readUInt16BE(file)

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
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseLocaTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): LocaTable {
    const locas: LocaTable = []

    let previousGlyphsOffset = 0
    const numGlyphs = tables.maxp!.numGlyphs!
    for (let i = 0; i < numGlyphs + 1; i++) {
        let currentGlyphsOffset = 0
        if (tables.head!.indexToLocFormat === 'short') {
            currentGlyphsOffset = readUInt16BE(file) * 2
        } else {
            currentGlyphsOffset = readUInt32BE(file)
        }

        if (i > 0) {
            locas.push({
                offset: previousGlyphsOffset,
                _length: currentGlyphsOffset - previousGlyphsOffset,
                _index: i - 1,
            })
        }
        previousGlyphsOffset = currentGlyphsOffset
    }
    return locas
}

/**
 * 解析 'hmtx' 表
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseHmtxTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): HmtxTable {
    const numOfLongHorMetrics = tables.hhea!.numOfLongHorMetrics

    const hmtxTable: HmtxTable = {
        hMetrics: []
    }
    for (let i = 0; i < numOfLongHorMetrics; i++) {
        const advanceWidth = readUInt16BE(file)
        const leftSideBearing = readInt16BE(file)
        hmtxTable.hMetrics.push({advanceWidth, leftSideBearing})
    }

    const numOfLeftSideBearing = (currentTable.length - numOfLongHorMetrics * 4) / 2
    if (numOfLeftSideBearing > 0) {
        hmtxTable.leftSideBearing = []
        for (let i = 0; i < numOfLeftSideBearing; i++) {
            hmtxTable.leftSideBearing.push(readFWord(file))
        }
    }

    return hmtxTable
}

/**
 * 解析 'name' 表
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseNameTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): NameTable {
    const format = readUInt16BE(file)
    const count = readUInt16BE(file)
    const stringOffset = readUInt16BE(file)

    const nameRecord: NameRecord[] = []
    for (let i = 0; i < count; i++) {
        const platformID = readUInt16BE(file)
        const encodingID = readUInt16BE(file)
        const languageID = readUInt16BE(file)
        const nameID = readUInt16BE(file)
        const length = readUInt16BE(file)
        const offset = readUInt16BE(file)
        nameRecord.push({
            platformID,
            encodingID,
            languageID,
            nameID,
            length,
            offset,
            _index: i,
        })
    }

    if (stringOffset !== 6 + count * 12) {
        throw new Error('[warn] string offset of name table not next to header.')
    }

    for (let i = 0; i < count; i++) {
        const record = nameRecord[i]

        setFileOffset(currentTable.offset + stringOffset + record.offset)
        const nameBuf = readBuffer(file, record.length)
        parseNameStringInPlace(nameBuf, record)
    }

    return {
        format,
        count,
        stringOffset,
        nameRecord,
    }
}

/**
 * 解析 'glyf' 表
 * @param file 字体数据
 * @param currentTable 当前表的元数据
 * @param tables 已解析的tables
 */
function parseGlyfTable(file: Buffer, currentTable: DirectoryEntry, tables: Tables): GlyfTable {
    tables.loca?.sort((a, b) => a._index > b._index ? 1 : -1)

    const glyfTable: GlyfTable = []
    tables.loca?.forEach(loca => {
        if (loca._length === 0) {
            glyfTable.push({
                _index: loca._index,
                _length: 0,
            })
            return
        }
        const numberOfContours = readInt16BE(file)
        const xMin = readFWord(file)
        const yMin = readFWord(file)
        const xMax = readFWord(file)
        const yMax = readFWord(file)
        const buf = readBuffer(file, loca._length - 10)

        glyfTable.push({
            numberOfContours,
            xMin,
            yMin,
            xMax,
            yMax,
            data: buf,
            _index: loca._index,
            _length: loca._length,
            _kind: numberOfContours >= 0 ? 'simple' : 'compound',
        })
    })

    return glyfTable
}
