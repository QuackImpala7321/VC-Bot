import { APIEmbedField, ChatInputCommandInteraction, Client, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from ".";
import { getData, saveData } from "../data-handler";

export default class ViewRolesCommand implements SlashCommand {
    data = new SlashCommandBuilder()
        .setName('view-roles')
        .setDescription('Lists roles that correlate to voice channels.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const embed = new EmbedBuilder()
            .setTitle('Active roles')
            .setColor('Blue')
        const fields: APIEmbedField[] = []

        const data = getData(interaction.guildId)
        let changed = false
        for (const vcRole of data.values()) {
            const channel = interaction.guild.channels.cache.get(vcRole.channelId)
            const role = interaction.guild.roles.cache.get(vcRole.roleId)
            if (!channel || !role) {
                data.delete(vcRole.channelId)
                changed = true
                continue
            }
            fields.push({
                name: `<#${channel.id}>`,
                value: `<@&${role.id}>`
            })
        }
        embed.addFields(fields)
        await interaction.reply({
            embeds: [ embed.data ],
            ephemeral: true
        })
        if (changed)
            saveData(interaction.guildId, data)
    }
}