import {
    readUInt16BE,
    readInt16BE,
    readUInt32BE,
    readBuffer,
    getFileOffset,
    readLongDateTime,
    readFWord,
    setFileOffset,
    parseNameStringInPlace,
    parseGlyfData,
    parseCmapSubtablesInPlace
} from './utils'
import {
    CmapEncodingSubtable,
    CmapTable,
    DirectoryEntry, DirectoryOffsetSubTable, DirectoryTable, GlyfDef, GlyfTable,
    HeadTable,
    HheaTable, HmtxTable, LocaEntry,
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

    // data table
    const tables = parseDataTable(file, directory.entries)

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
function parseDataTable(file: Buffer, directory: DirectoryEntry[]): Tables {
    const tables: Tables = {}

    for (let i = 0; i < directory.length; i++) {
        const tableDesc = directory[i]
        if (tableDesc.tag === 'hhea') {
            tables.hhea = parseHheaTable(file, directory, tables)
        } else if (tableDesc.tag === 'head') {
            tables.head = parseHeadTable(file, directory, tables)
        } else if (tableDesc.tag === 'maxp') {
            tables.maxp = parseMaxpTable(file, directory, tables)
        } else if (tableDesc.tag === 'loca') {
            tables.loca = parseLocaTable(file, directory, tables)
        } else if (tableDesc.tag === "hmtx") {
            tables.hmtx = parseHmtxTable(file, directory, tables)
        } else if (tableDesc.tag === "name") {
            tables.name = parseNameTable(file, directory, tables)
        } else if (tableDesc.tag === "glyf") {
            tables.glyf = parseGlyfTable(file, directory, tables)
        } else if (tableDesc.tag === "cmap") {
            tables.cmap = parseCmapTable(file, directory, tables)
        }
    }

    return tables
}

/**
 * 解析 'hhea' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHheaTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): HheaTable {
    const tableDesc = directory.find(table => table.tag === 'hhea')
    if (!tableDesc) {
        throw new Error(`'hhea' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

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
        _parsed: true,
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
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHeadTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): HeadTable {
    const tableDesc = directory.find(table => table.tag === 'head')
    if (!tableDesc) {
        throw new Error(`'head' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

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
        _parsed: true,
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
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseMaxpTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): MaxpTable {
    const tableDesc = directory.find(table => table.tag === 'maxp')
    if (!tableDesc) {
        throw new Error(`'maxp' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

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
        _parsed: true,
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
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseLocaTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): LocaTable {
    const tableDesc = directory.find(table => table.tag === 'loca')
    if (!tableDesc) {
        throw new Error(`'loca' 表不存在`)
    }

    // 确保 loca 表所依赖的表先进行解析
    if (!tables.maxp || !tables.maxp._parsed) {
        tables.maxp = parseMaxpTable(file, directory, tables)
    }
    if (!tables.head || !tables.head._parsed) {
        tables.head = parseHeadTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

    const locas: LocaEntry[] = []

    let previousGlyphsOffset = 0
    const numGlyphs = tables.maxp.numGlyphs
    for (let i = 0; i < numGlyphs + 1; i++) {
        let currentGlyphsOffset = 0
        if (tables.head.indexToLocFormat === 'short') {
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
    return {
        _parsed: true,
        entries: locas,
    }
}

/**
 * 解析 'hmtx' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseHmtxTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): HmtxTable {
    const tableDesc = directory.find(table => table.tag === 'hmtx')
    if (!tableDesc) {
        throw new Error(`'hmtx' 表不存在`)
    }

    // 确保 hmtx 表所依赖的表先进行解析
    if (!tables.hhea || !tables.hhea._parsed) {
        tables.hhea = parseHheaTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

    const numOfLongHorMetrics = tables.hhea.numOfLongHorMetrics

    const hmtxTable: HmtxTable = {
        _parsed: false,
        hMetrics: []
    }
    for (let i = 0; i < numOfLongHorMetrics; i++) {
        const advanceWidth = readUInt16BE(file)
        const leftSideBearing = readInt16BE(file)
        hmtxTable.hMetrics.push({advanceWidth, leftSideBearing})
    }

    const numOfLeftSideBearing = (tableDesc.length - numOfLongHorMetrics * 4) / 2
    if (numOfLeftSideBearing > 0) {
        hmtxTable.leftSideBearing = []
        for (let i = 0; i < numOfLeftSideBearing; i++) {
            hmtxTable.leftSideBearing.push(readFWord(file))
        }
    }

    hmtxTable._parsed = true
    return hmtxTable
}

/**
 * 解析 'name' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseNameTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): NameTable {
    const tableDesc = directory.find(table => table.tag === 'name')
    if (!tableDesc) {
        throw new Error(`'name' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

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

        setFileOffset(tableDesc.offset + stringOffset + record.offset)
        const nameBuf = readBuffer(file, record.length)
        parseNameStringInPlace(nameBuf, record)
    }

    return {
        _parsed: true,
        format,
        count,
        stringOffset,
        nameRecord,
    }
}

/**
 * 解析 'glyf' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseGlyfTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): GlyfTable {
    const tableDesc = directory.find(table => table.tag === 'glyf')
    if (!tableDesc) {
        throw new Error(`'glyf' 表不存在`)
    }

    // 确保 glyf 表所依赖的表先进行解析
    if (!tables.loca || !tables.loca._parsed) {
        tables.loca = parseLocaTable(file, directory, tables)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

    tables.loca.entries.sort((a, b) => a._index > b._index ? 1 : -1)

    const glyfDefs: GlyfDef[] = []
    tables.loca.entries.forEach(loca => {
        if (loca._length === 0) {
            // 表示该位置的字型是缺失的
            glyfDefs.push({
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
        // const buf = readBuffer(file, loca._length - 10)
        const buf = parseGlyfData(file, numberOfContours, loca._length - 10)
        glyfDefs.push({
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

    return {
        _parsed: true,
        entries: glyfDefs,
    }
}

/**
 * 解析 'cmap' 表
 * @param file 字体数据
 * @param directory 表目录
 * @param tables 已解析的tables
 */
function parseCmapTable(file: Buffer, directory: DirectoryEntry[], tables: Tables): CmapTable {
    const tableDesc = directory.find(table => table.tag === 'cmap')
    if (!tableDesc) {
        throw new Error(`'cmap' 表不存在`)
    }

    // 将文件指针指向要解析的表偏移
    setFileOffset(tableDesc.offset)

    const version = readUInt16BE(file)
    const numberSubtables = readUInt16BE(file)

    const subtables: CmapEncodingSubtable[] = []
    for (let i = 0; i < numberSubtables; i++) {
        const platformID = readUInt16BE(file)
        const encodingID = readUInt16BE(file)
        const offset = readUInt32BE(file)
        subtables.push({
            platformID,
            encodingID,
            offset,
        })
    }
    parseCmapSubtablesInPlace(file, tableDesc, subtables)

    return {
        _parsed: true,
        version,
        numberSubtables,
        subtables,
    }
}
