import { ChatInputCommandInteraction, Client, Collection, IntentsBitField, VoiceBasedChannel } from "discord.js";
import { config } from "./config";
import { commands, getCommands } from "./commands/index";
import { joinedFromNowhere, joinedFromChannel, leftChannel } from "./state-change";
import { createRoleName, getRolesMap, saveRolesMap } from "./roles-fetch";
import VCRole from "./vc-role";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

getCommands();

client.once('ready', (c) => {
    console.log(`${c.user.tag} is now online.`);

    client.guilds.cache.forEach(async (guild) => {
        for (const command of commands.values()) {
            guild.commands.create(command.data);
        }

        const rolesMap = getRolesMap(guild.id);
        
        const populatedVoiceChannels = guild.channels.cache.filter((channel) => channel.isVoiceBased() && channel.members.size > 0);
        
        for (const pair of populatedVoiceChannels) {
            const channel = pair[1] as VoiceBasedChannel;
            const vcRole = rolesMap.get(channel.id);
            let role = guild.roles.cache.find((role) => role.id === vcRole?.roleId);

            if (!vcRole || !role) {
                role = await guild.roles.create({
                    name: createRoleName(channel),
                    mentionable: true
                });
                if (!role) throw new Error("Could not create role");

                rolesMap.set(channel.id, new VCRole(channel.id, role.id));
            }

            const constRole = role;
            channel.members.forEach((member) => member.roles.add(constRole));
        }

        if (rolesMap.size > 0) {
            saveRolesMap(rolesMap, guild.id);
        }
    });
});

function iterableContains<T>(iterable: IterableIterator<T>, value: T) {
    for (const iterator of iterable) {
        if (iterator === value) {
            return true;
        }
    }
    return false;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction as ChatInputCommandInteraction, interaction.client);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!newState.channelId) {
        leftChannel(oldState);
    } else if (oldState.channelId !== newState.channelId && !oldState.channelId) {
        joinedFromNowhere(newState);
    } else if (oldState.channelId !== newState.channelId) {
        joinedFromChannel(oldState, newState);
    }
});

client.on('channelDelete', (channel) => {
    if (!channel.isVoiceBased()) return;
    const rolesMap = getRolesMap(channel.guildId);

    const vcRole = rolesMap.get(channel.id);
    if (!vcRole) return;
    rolesMap.delete(vcRole.channelId);

    const role = channel.guild.roles.cache.find((role) => role.id === vcRole.roleId);
    if(!role) return;
    channel.guild.roles.delete(role);
});

client.on('roleDelete', (role) => {
    const rolesMap = getRolesMap(role.guild.id);

    let channelId;
    for (const vcRole of rolesMap.values()) {
        if (vcRole.roleId === role.id) {
            channelId = vcRole.channelId;
            break;
        }
    }
    if (!channelId) return;
    rolesMap.delete(channelId);

    saveRolesMap(rolesMap, role.guild.id);
})

client.login(config.TOKEN);