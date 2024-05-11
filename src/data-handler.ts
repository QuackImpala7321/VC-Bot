import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { resolve } from 'path'

export interface VCRole {
    channelId: string
    roleId: string
}

export class GData extends Map<String, VCRole>{}
const dataDir = resolve(__dirname, '../server_data')

export function guildList() {
    const fileNames = readdirSync(dataDir)
    const result: string[] = []
    for (const name of fileNames)
        if (name.endsWith('.json'))
            result.push(name.substring(0, name.lastIndexOf('.json')))
    return result
}

export function getData(guildId: string) {
    const path = resolve(dataDir, `${guildId}.json`)
    if (!existsSync(path))
        return new GData()
    const json = JSON.parse(readFileSync(path, 'utf-8'))

    const data = new GData()
    for (const key of Object.keys(json))
        data.set(key, {
            channelId: key,
            roleId: json[key]
        }
    )
    return data
}

export function saveData(guildId: string, data: GData) {
    const path = resolve(dataDir, `${guildId}.json`)
    if (data.size < 1) {
        if (existsSync(path))
            deleteData(guildId)
        return
    }
    const json = {}
    for (const entry of data.entries())
        json[entry[0].toString()] = entry[1].roleId
    writeFileSync(path, JSON.stringify(json))
}

export function deleteData(guildId: string) {
    const path = resolve(dataDir, `${guildId}.json`)
    unlinkSync(path)
}