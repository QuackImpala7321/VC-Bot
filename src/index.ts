import { ChatInputCommandInteraction, Client, Collection, IntentsBitField, Role, VoiceChannel, REST } from 'discord.js'

import { config } from './config'
import { onJoin, onLeave, onSwitch } from './state-update'
import { getData, saveData } from './data-handler'
import { commands, registerCommands, removeOld } from './commands'

const testGuild = '837751878359711744'

export const rest = new REST().setToken(config.TOKEN)
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
})

client.once('ready', async c => {
    console.log(`${c.user.tag} is online`)
    await registerCommands()
    
    for (const guild of client.guilds.cache.values()) {
        await removeOld(guild.id)
        for (const command of commands.values())
            guild.commands.create(command.data)
        
        const data = getData(guild.id)
        let changed = false
        for (const channel of (guild.channels.cache.filter(ch => ch instanceof VoiceChannel && ch.members.size > 0) as Collection<string, VoiceChannel>).values()) {
            let role: Role
            if (data.has(channel.id))
                role = guild.roles.cache.get(data.get(channel.id).roleId)
            else {
                role = await guild.roles.create({
                    name: `VC - ${channel.name}`,
                    mentionable: true,
                    permissions: []
                })
                data.set(channel.id, {
                    channelId: channel.id,
                    roleId: role.id
                })
                changed = true
            }
            for (const member of channel.members.values())
                member.roles.add(role)
        }
        if (changed)
            saveData(guild.id, data)
    }
})

client.once('roleDelete', async role => {
    const guildId = role.guild.id
    const data = getData(guildId)
    for (const entry of data.entries()) {
        if (entry[1].roleId !== role.id)
            continue
        data.delete(entry[0])
        saveData(guildId, data)
        return
    }
})

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.channelId === oldState.channelId)
        return
    if (newState.channelId && !oldState.channelId)
        await onJoin(newState)
    else if (oldState.channelId && !newState.channelId)
        await onLeave(oldState)
    else if (newState.channelId && oldState.channelId)
        await onSwitch(oldState, newState)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand())
        return

    const command = commands.get(interaction.commandName)
    if (!command)
        return
    await command.execute(interaction as ChatInputCommandInteraction, interaction.client)
})

client.login(config.TOKEN)