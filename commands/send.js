/**
 * Created by Peter on 07/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Send Money",
    usage: "send @User amount",
    accessLevel: 0,
    commands: ["send", "pay", "give"],
    run: function run(user, userID, channel, message, args, event, bot){
        if(args.length < 3){
            bot.sendMessage({
                to: channel,
                message: ":bangbang: You must specify a **user** and an **amount**:\n`send @user amount`"
            });
        }else{
            var amount = parseInt(args[2]);
            if(!amount || amount <= 0){
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: You must specify a valid amount!"
                });
            }else{
                var to = args[1].replace(/[@<>!]/g, "");
                if (!bot.users[to]){
                    bot.sendMessage({
                        to: channel,
                        message: ":bangbang: You must specify a valid user!"
                    });
                }else{
                    bot.database.getBalance(userID)
                        .then(function (result) {
                            if (result[0].balance >= amount) {
                                return bot.database.transact(userID, to, amount)
                            }else{
                                bot.sendMessage({
                                    to: channel,
                                    message: `:bangbang: You don't have enough for that! You only have **${result[0].balance}** ${config.get("Bot.defaultCurrency")}${amount > 1 ? "s" : ""}.`
                                });
                            }
                        })
                        .then(function(sent){
                            if(sent) {
                                bot.sendMessage({
                                    to: channel,
                                    message: `:dollar: Sent **${bot.users[to].username}** **${amount}** ${config.get("Bot.defaultCurrency")}${amount > 1 ? "s" : ""}.`
                                });
                            }
                        })
                        .catch(function(err){
                           bot.sendMessage({
                               to: channel,
                               message: `:bangbang: **Error sending money, you have not been charged**.\n\`${err}\``
                           })
                        });
                }

            }
        }

    }
};