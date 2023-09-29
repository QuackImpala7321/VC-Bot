import { Collection } from "discord.js";
import { SlashCommand } from "../types";
import * as path from "path";
import * as fs from "fs";

export const commands: Collection<string, SlashCommand> = new Collection();

export function getCommands() {
    try {
        const commandsFolder = fs.readdirSync(__dirname);
        const commandFiles = commandsFolder.filter((path) => path !== 'index.js' && path.endsWith('js'));

        commandFiles.forEach(async (_path) => {
            const scriptPath = path.resolve(__dirname, _path);

            const Command = (await import(path.resolve(scriptPath))).default;
            const command: SlashCommand = new Command();
            commands.set(command.data.name, command);
        });
        
    } catch (error) {
        console.error(error);
    }
}