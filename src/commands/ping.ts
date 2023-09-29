import { ActionRowBuilder, ChatInputCommandInteraction, Client, SelectMenuBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, VoiceBasedChannel, userMention } from "discord.js";
import { SlashCommand } from "../types";

export default class PingCommand implements SlashCommand {
    public data: SlashCommandBuilder = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("pings a voice channel");

    public async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const voiceChannel = await this.askVoiceChannel(interaction);
        if (!voiceChannel) return;

        let mentionString = "";
        for (const member of voiceChannel.members) {
            mentionString = `${mentionString} ${userMention(member[1].id)}`;
        }
        if (mentionString === "") return;
        await interaction.channel?.send(mentionString);
        return await interaction.editReply({
            content: mentionString
        });
    }

    private async askVoiceChannel(interaction: ChatInputCommandInteraction) {
        if (!interaction.channel) return;

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ping-voice')
            .setPlaceholder('Select');

        const voiceChannels = interaction.guild?.channels.cache.filter((channel) => channel.isVoiceBased());
        if (!voiceChannels) return;
        
        voiceChannels.forEach((channel) => {
            menu.addOptions(
                new StringSelectMenuOptionBuilder()
                .setLabel(channel.name)
                .setValue(channel.id)
            );
        });

        const reply = await interaction.reply({
            content: "Select a voice channel",
            ephemeral: true,
            components: [
                new ActionRowBuilder<SelectMenuBuilder>().addComponents(menu)
            ]
        });

        try {
            const confirmation = await reply.awaitMessageComponent();
            if (!interaction.guild) throw new Error("Could not fetch guild");
            const channel = interaction.guild.channels.cache.find((channel) => channel.id === (confirmation as any).values[0]);
            if (!channel) throw new Error("Could not find channel.");

            // start here
            if (!channel.isVoiceBased()) throw new Error("Channel is not voice based.");

            return channel as VoiceBasedChannel;
        } catch (error) {
            console.error(error);
        }
    }
}