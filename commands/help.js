/**
 * Created by Peter on 07/06/2017.
 */
module.exports = {
    name: "Help Command",
    usage: "help [command]",
    accessLevel: 0,
    commands: ["help", "commands"],
    run: function run(user, userID, channel, message, args, event, bot){
       var output = "COMMANDS:\n";
       for(var i in bot.commandUsages){
           output += `**${i}** - ${bot.commandUsages[i].usage}\n`
       }

       bot.sendMessage({
           to: channel,
           message: output
       });

    }
};