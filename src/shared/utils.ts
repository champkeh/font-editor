export function addSeconds2Date(target: Date, seconds: number): string {
    target.setTime(target.getTime() + seconds * 1000)

    return new Intl.DateTimeFormat("en", {}).format(target)
}
