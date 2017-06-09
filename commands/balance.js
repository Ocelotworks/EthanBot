/**
 * Created by Peter on 07/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Balance",
    usage: "balance [user]",
    accessLevel: 0,
    commands: ["balance"],
    run: function run(user, userID, channel, message, args, event, bot){
        var target = args[1] ? args[1].replace(/[!<>@]/g, "") : userID;


        bot.database.getBalance(target)
            .then(function(result){
               var balance = result[0].balance;
               bot.sendMessage({
                   to: channel,
                   message: `:dollar: <@${target}> has **${result[0] ? result[0].balance : 0}** ${config.get("Bot.defaultCurrency")}${balance > 1 ? "s" : ""}.`
               });
            });


    }
};