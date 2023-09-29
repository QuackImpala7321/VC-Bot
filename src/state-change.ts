import { VoiceBasedChannel, VoiceState } from "discord.js";
import { getRolesMap, saveRolesMap } from "./roles-fetch";
import VCRole from "./vc-role";
import { createRoleName } from "./roles-fetch";

export async function joinedFromNowhere(state: VoiceState) {
    if(!state.channel || !state.channelId || !state.member) return;
    const rolesMap = getRolesMap(state.guild.id);
    const vcRole = rolesMap.get(state.channelId);

    if (!vcRole) {
        const role = await state.guild.roles.create({
            name: createRoleName(state.channel),
            mentionable: true
        });
        state.member.roles.add(role);
        rolesMap.set(state.channelId, new VCRole(state.channelId, role.id));
        saveRolesMap(rolesMap, state.guild.id);
    } else {
        const role = state.guild.roles.cache.find((role) => role.id === vcRole.roleId);
        if (!role) throw new Error("Could not find role.");
        
        state.member.roles.add(role);
        console.log(`Added ${role.name} role to ${state.member.displayName}`);
    }
}

export function joinedFromChannel(oldState: VoiceState, newState: VoiceState) {
    leftChannel(oldState);
    joinedFromNowhere(newState);
}

export function leftChannel(state: VoiceState) {
    if (!state.channelId || !state.member) return;
    
    const rolesMap = getRolesMap(state.guild.id);
    const vcRole = rolesMap.get(state.channelId);
    if (!vcRole) return;

    const role = state.guild.roles.cache.find((role) => role.id === vcRole.roleId);
    if(!role) throw new Error("Could not find role.");
    
    state.member.roles.remove(role);
    console.log(`Removed ${role.name} role from ${state.member.displayName}`);
    
}