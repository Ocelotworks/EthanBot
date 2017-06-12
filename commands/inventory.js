/**
 * Created by Peter on 12/06/2017.
 */

const numbers = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

module.exports = {
    name: "View Inventory",
    usage: "inventory [@user]",
    accessLevel: 0,
    commands: ["inventory", "inv"],
    run: function run(user, userID, channel, message, args, event, bot) {
        var target = userID;

        if(args[1] && args[1].startsWith("<")){
            target = args[1].replace(/[<>@!]/g, "");
        }
        bot.database.getInventory(target)
            .then(function(result){
                if(result.length == 0){
                    bot.sendMessage({
                        to: channel,
                        message: `:spider_web: <@${target}>'s Inventory is empty! ${userID == target ? "Maybe check out !shop?" : ""}`
                    });
                }else{
                    var output = `**<@${target}>'s Inventory:**\n`;
                    for(var i in result){
                        if(result.hasOwnProperty(i)) {
                            var item = result[i];
                            output += `${numbers[i]} \`${item.amount}x\` **${item.name}**\n`;
                        }
                    }
                    bot.sendMessage({
                        to: channel,
                        message: output
                    });
                }
            });
    }
};