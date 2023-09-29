import { ChatInputCommandInteraction, Client, IntentsBitField, VoiceBasedChannel } from "discord.js";
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
        const rolesMap = getRolesMap(guild.id);
        for (const vcRole of rolesMap.values()) {
            const channel = guild.channels.cache.find((channel) => channel.id === vcRole.channelId);
            if(channel) continue;

            const role = guild.roles.cache.find((role) => role.id === vcRole.roleId);
            if (!role) continue;

            guild.roles.delete(role);
        }
        
        for (const command of commands.values()) {
            guild.commands.create(command.data);
        }

        const voiceChannels = guild.channels.cache.filter((channel) => channel.isVoiceBased() && iterableContains(rolesMap.keys(), channel.id));
        for (const channel of voiceChannels) {
            const voiceChannel = channel[1] as VoiceBasedChannel;

            let vcRole = rolesMap.get(voiceChannel.id);
            if (!vcRole) {
                const role = await guild.roles.create({ name: createRoleName(voiceChannel) });
                vcRole = new VCRole(voiceChannel.id, role.id);

                rolesMap.set(voiceChannel.id, vcRole);
                saveRolesMap(rolesMap, guild.id);
            }

            const role = voiceChannel.guild.roles.cache.find((role) => role.id === vcRole?.roleId);
            if (!role) continue;

            voiceChannel.members.forEach(member => {
                member.roles.add(role);
            });
        }
    });
});

function iterableContains(iterable: IterableIterator<any>, value: any) {
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