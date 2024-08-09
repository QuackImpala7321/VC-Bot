import { ChatInputCommandInteraction, Client, Guild, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from ".";
import { getData } from "../data-handler";

export default class DetachCommand implements SlashCommand {
    data = new SlashCommandBuilder()
        .setName('detach')
        .setDescription('Removes VC roles from all members.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)

    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        await detach(interaction.guild)

        await interaction.reply({
            content: 'Removed all VC roles from members.',
            ephemeral: true
        })
    }
}

export async function detach(guild: Guild) {
    const data = getData(guild.id)
    console.log(`Detach ${guild.name}`)
    for (const vcRole of data.values()) {
        const role = guild.roles.cache.get(vcRole.roleId)
        if (!role)
            continue
        console.log(`\t${role.name}`)
        for (const member of role.members.values()){
            console.log(`\t\t${member.displayName}`)
            await member.roles.remove(role)
        }
    }
}