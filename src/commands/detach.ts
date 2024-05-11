import { ChatInputCommandInteraction, Client, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { myId, SlashCommand } from ".";
import { getData } from "../data-handler";

export default class DetachCommand implements SlashCommand {
    data = new SlashCommandBuilder()
        .setName('detach')
        .setDescription('Removes VC roles from all members.')
        .setDefaultMemberPermissions(268435456)

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const data = getData(interaction.guildId)
        for (const vcRole of data.values()) {
            const role = interaction.guild.roles.cache.get(vcRole.roleId)
            if (!role)
                continue
            for (const member of role.members.values())
                member.roles.remove(role)
        }

        await interaction.reply({
            content: 'Removed all VC roles from members.',
            ephemeral: true
        })
    }
}