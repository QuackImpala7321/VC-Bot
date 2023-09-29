import { ChatInputCommandInteraction, SlashCommandBuilder, Client } from "discord.js";

export interface SlashCommand {
    data: SlashCommandBuilder,
    execute: (interaction: ChatInputCommandInteraction, client: Client) => void
}