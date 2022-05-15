export interface OffsetSubTable {
    scalerType: number
    numTables: number
    searchRange: number
    entrySelector: number
    rangeShift: number
    _blockSize: number
}

export interface DirectoryEntry {
    tag: string
    checksum: number
    offset: number
    length: number
    _blockSize: number
    _pad: number
}

export interface ParsedFont {
    offset: OffsetSubTable
    directory: DirectoryEntry[]
}
