function set(obj, key, value) {
    const keys = key.split('.').filter(k => k !== '')
    keys.slice(0, -1).reduce((prev, cur) =>
        prev[cur] = typeof prev[cur] === 'object' ? prev[cur] : {},
        obj)[keys[keys.length-1]] = value
    return obj
}

console.log(JSON.stringify(set({
    a: {
        b: {
            c: 2
        }
    }
}, 'a.b.c.d', 2), null, '  '))
