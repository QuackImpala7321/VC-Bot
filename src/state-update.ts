import { Role, VoiceState } from "discord.js";
import { GData, getData, saveData } from "./data-handler";

export async function onJoin(newState: VoiceState) {
    const data = getData(newState.guild.id)
    let role: Role
    if (data.has(newState.channelId)) {
        const vcRole = data.get(newState.channelId)
        role = newState.guild.roles.cache.get(vcRole.roleId)
        if (!role)
            role = await createRole(data, newState)
    } else
        role = await createRole(data, newState)
    newState.member.roles.add(role)
}

export async function onLeave(oldState: VoiceState) {
    const data = getData(oldState.guild.id)
    if (!data.has(oldState.channelId))
        return

    const vcRole = data.get(oldState.channelId)
    const role = oldState.guild.roles.cache.get(vcRole.roleId)
    if (role)
        oldState.member.roles.remove(role)
}

export async function onSwitch(oldState: VoiceState, newState: VoiceState) {
    await onLeave(oldState)
    await onJoin(newState)
}

async function createRole(data: GData, state: VoiceState) {
    const role = await state.guild.roles.create({
        name: `VC - ${state.channel.name}`,
        mentionable: true,
        permissions: []
    })
    data.set(state.channelId, {
        channelId: state.channelId,
        roleId: role.id
    })
    saveData(state.guild.id, data)
    return role
}