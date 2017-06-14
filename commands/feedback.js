/**
 * Created by Peter on 13/06/2017.
 */
module.exports = {
    name: "Leave Feedback",
    usage: "feedback [message]",
    accessLevel: 0,
    commands: ["feedback", "support"],
    run: function run(user, userID, channel, message, args, event, bot) {
        var server = bot.channels[channel] ? bot.channels[channel].guild_id : "DM";
        if(args.length > 1){
            bot.sendMessage({
                to: channel,
                message: ":white_check_mark: Your feedback has been sent. Please note we cannot respond to all feedback."
            });
            bot.sendMessage({
                to: "139871249567318017",
                message: `Feedback from ${userID} (${user}) in ${server} (${bot.servers[server] ? bot.servers[server].name : "DM"}):\n${message}`
            });
        }else{
            bot.sendMessage({
                to: channel,
                message: `:bangbang: You must enter some feedback. i.e **${bot.prefixCache[server]}feedback This bot is amazing!**`
            })
        }
    }
};