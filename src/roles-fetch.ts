import * as fs from "fs";
import * as path from "path";
import VCRole from "./vc-role";
import { VoiceBasedChannel } from "discord.js";

const DATA_PATH = path.resolve(__dirname, "../data");

export function getOrCreateDataFolder() {
    var dataFolder: string[];
    try {
        dataFolder = fs.readdirSync(DATA_PATH);
    } catch (error) {
        fs.mkdirSync(DATA_PATH);
        dataFolder = fs.readdirSync(DATA_PATH);
    }
    return dataFolder;
}

export function getRolesMap(guildId: string): Map<string, VCRole> {
    getOrCreateDataFolder();
    
    const guildPath = path.resolve(DATA_PATH, `${guildId}.json`);
    var guildData;
    try {
        guildData = JSON.parse(fs.readFileSync(guildPath, 'utf-8'));
        guildData.entries;
    } catch (error) {
        guildData = {
            entries: []
        };
    }

    const rolesMap = new Map<string, VCRole>();

    guildData.entries.forEach((entry: {
        channelId: string,
        roleId: string
    }) => {
        try {
            const role = new VCRole(entry.channelId, entry.roleId);
            rolesMap.set(role.channelId, role);
        } catch (error) {
            console.error(error);
        }
    });

    return rolesMap;
}

export function saveRolesMap(rolesMap: Map<string, VCRole>, guildId: string) {
    getOrCreateDataFolder();
    
    const json = {
        entries: [] as any[]
    };
    for (const role of rolesMap.values()) {
        json.entries.push(role.toJson());
    }

    const guildPath = path.resolve(DATA_PATH, `${guildId}.json`);
    fs.writeFileSync(guildPath, JSON.stringify(json));
}

export function createRoleName(channel: VoiceBasedChannel) {
    return `VC - ${channel.name}`;
}