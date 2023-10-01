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
        for (const vcRole of rolesMap.values()) {
            const channel = guild.channels.cache.find((channel) => channel.id === vcRole.channelId);
            const role = guild.roles.cache.find((role) => role.id === vcRole.roleId);
            if (!role) continue;

            if(!(channel && channel.isVoiceBased())) {
                guild.roles.delete(role);
                continue;
            }

            const roleMemberIds: string[] = [];
            role.members.forEach((member) => roleMemberIds.push(member.id));
            console.log(roleMemberIds);

            const channelMemberIds: string[] = [];
            channel.members.forEach((member) => channelMemberIds.push(member.id));
            console.log(channelMemberIds);
            
            const differenceIds = channelMemberIds.filter((channelMemId) => !roleMemberIds.includes(channelMemId));
            for (const id of differenceIds) {
                const member = guild.members.cache.find((member) => member.id === id);
                if (!member) throw new Error("Could not find member.");
                member.roles.remove(role);
            }
        }

        const dataVoiceChannels = guild.channels.cache.filter((channel) => channel.isVoiceBased() && iterableContains(rolesMap.keys(), channel.id));
        for (const channel of dataVoiceChannels) {
            const voiceChannel = channel[1] as VoiceBasedChannel;

            let vcRole = rolesMap.get(voiceChannel.id);
            if (!vcRole) {
                const role = await guild.roles.create({
                    name: createRoleName(voiceChannel),
                    mentionable: true
                });
                vcRole = new VCRole(voiceChannel.id, role.id);

                rolesMap.set(voiceChannel.id, vcRole);
            }

            const role = voiceChannel.guild.roles.cache.find((role) => role.id === vcRole?.roleId);
            if (!role) continue;

            voiceChannel.members.forEach(member => {
                member.roles.add(role);
            });
        }
        if (rolesMap.entries()) {
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