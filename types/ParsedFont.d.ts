export interface DirectoryOffsetSubTable {
    scalerType: number
    numTables: number
    searchRange: number
    entrySelector: number
    rangeShift: number
    _blockSize: number
}

export interface DirectoryEntry {
    tag: keyof TableTagNameMap
    checksum: number
    offset: number
    length: number
    _blockSize: number
    _pad: number
}

export type Tables = {
    [tag in keyof TableTagNameMap]?: TableTagNameMap[tag]
}

interface BaseTable {
    _parsed: boolean
}

interface TableTagNameMap {
    "hhea": HheaTable
    "head": HeadTable
    "maxp": MaxpTable
    "loca": LocaTable
    "hmtx": HmtxTable
    "name": NameTable
    "glyf": GlyfTable
    "cmap": CmapTable
}

export interface ParsedFont {
    directory: DirectoryTable
    tables: Tables
}

export interface DirectoryTable {
    offset: DirectoryOffsetSubTable
    entries: DirectoryEntry[]
}

export interface HheaTable extends BaseTable {
    version: string
    ascent: number
    descent: number
    lineGap: number
    advanceWidthMax: number
    minLeftSideBearing: number
    minRightSideBearing: number
    xMaxExtent: number
    caretSlopeRise: number
    caretSlopeRun: number
    caretOffset: number
    reserved: ArrayBuffer
    metricDataFormat: number
    numOfLongHorMetrics: number
}

export interface HeadTable extends BaseTable {
    version: string
    fontRevision: string
    checkSumAdjustment: number
    magicNumber: number
    flags: number
    unitsPerEm: number
    created: string
    modified: string
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    macStyle: number
    lowestRecPPEM: number
    fontDirectionHint: number
    indexToLocFormat: 'short' | 'long'
    glyphDataFormat: number
}

export interface MaxpTable extends BaseTable {
    version: string
    numGlyphs: number
    maxPoints: number
    maxContours: number
    maxComponentPoints: number
    maxComponentContours: number
    maxZones: number
    maxTwilightPoints: number
    maxStorage: number
    maxFunctionDefs: number
    maxInstructionDefs: number
    maxStackElements: number
    maxSizeOfInstructions: number
    maxComponentElements: number
    maxComponentDepth: number
}

export interface LocaEntry {
    offset: number
    _length: number
    _index: number
}
export interface LocaTable extends BaseTable {
    entries: LocaEntry[]
}

export interface LongHorMetric {
    advanceWidth: number
    leftSideBearing: number
}
export interface HmtxTable extends BaseTable {
    hMetrics: LongHorMetric[]
    leftSideBearing?: number[]
}

export interface NameRecord {
    platformID: number
    encodingID: number
    languageID: number
    nameID: number
    length: number
    offset: number
    _index: number
    _platform?: string
    _encoding?: string
    _language?: string
    _name?: string
    _value?: string
}
export interface NameTable extends BaseTable {
    format: number
    count: number
    stringOffset: number
    nameRecord: NameRecord[]
}

export interface EmptyGlyfDef {
    _index: number
    _length: 0
}
export interface NotEmptyGlyfDef {
    numberOfContours: number
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    data: SimpleGlyfData | CompoundGlyfData
    _index: number
    _length: number
    _kind: 'simple' | 'compound'
}
export type GlyfDef = EmptyGlyfDef | NotEmptyGlyfDef

export interface SimpleGlyfData {
    endPtsOfContours: number[]
    instructionLength: number
    instructions: ArrayBuffer
    // flags: number[]
    // xCoordinates: number[]
    // yCoordinates: number[]
    remind: ArrayBuffer
}
export type CompoundGlyfData = ArrayBuffer

export interface GlyfTable extends BaseTable {
    entries: GlyfDef[]
}
export interface GlyfFlag {
    onCurve?: boolean
    xShortVector?: boolean
    yShortVector?: boolean
    repeat?: boolean
    xSame?: boolean
    ySame?: boolean
    _index: number
    _bits: string
    _repeat?: number
    _copy?: boolean
}

export interface CmapEncodingSubtable {
    platformID: number
    encodingID: number
    offset: number
    _platform?: string
    _encoding?: string
    format?: number
    _data?: CmapFormat0 | CmapFormat2 | CmapFormat4 | CmapFormat12
}
export interface CmapTable extends BaseTable {
    version: number
    numberSubtables: number
    subtables: CmapEncodingSubtable[]
    _preferSubtable?: number
}
interface IGetGlyphIndex {
    getGlyphIndex(code: number): number
}
export interface CmapFormat0 extends IGetGlyphIndex{
    format: 0
    length: number
    language: number
    glyphIndexArray: number[]
}
export interface CmapFormat2 extends IGetGlyphIndex {
    format: 2
}
export interface CmapFormat4 extends IGetGlyphIndex {
    format: 4
    length: number
    language: number
    segCountX2: number
    searchRange: number
    entrySelector: number
    rangeShift: number
    endCode: number[]
    reservedPad: number
    startCode: number[]
    idDelta: number[]
    idRangeOffset: number[]
}

export interface CmapFormat12Group {
    startCharCode: number
    endCharCode: number
    startGlyphCode: number
}
export interface CmapFormat12 extends IGetGlyphIndex {
    format: 12
    reserved: number
    length: number
    language: number
    nGroups: number
    groups: CmapFormat12Group[]
}
