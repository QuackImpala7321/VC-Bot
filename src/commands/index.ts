import { ChatInputCommandInteraction, Client, Guild, Routes, SlashCommandBuilder } from 'discord.js'
import { readdirSync } from 'fs'
import { resolve } from 'path'

import { rest } from '../index'
import { config } from '../config'

export const myId = '369962150224986114'

export interface SlashCommand {
    data: SlashCommandBuilder,
    canAdd?: (guild: Guild) => Promise<boolean>,
    execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>
}

export const commands = new Map<String, SlashCommand>()

export async function registerCommands() {
    commands.clear()
    for (const fileName of readdirSync(__dirname).filter(n => n !== 'index.js' && n.endsWith('.js'))) {
        const Command = (await import(resolve(__dirname, fileName))).default
        const command: SlashCommand = new Command()
        commands.set(command.data.name, command)
    }
}

export async function removeOldCommands(guildId: string) {
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: [] })
}