export default class VCRole {
    public channelId: string;
    public roleId: string;
    
    constructor(channelId: string, roleId: string) {
        this.channelId = channelId;
        this.roleId = roleId;
    }

    public toJson() {
        return {
            channelId: this.channelId,
            roleId: this.roleId
        };
    }
}