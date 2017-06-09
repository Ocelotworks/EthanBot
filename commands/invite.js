/**
 * Created by Peter on 09/06/2017.
 */
module.exports = {
    name: "Invite Bot",
    usage: "invite",
    accessLevel: 0,
    commands: ["invite", "joinserver", "addbot"],
    run: function run(user, userID, channel, message, args, event, bot) {
        bot.sendMessage({
            to: channel,
            message: bot.inviteURL
        });
    }
};