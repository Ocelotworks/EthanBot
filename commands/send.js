/**
 * Created by Peter on 07/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Send Money",
    usage: "send @User amount",
    accessLevel: 0,
    commands: ["send", "pay"],
    run: function run(user, userID, channel, message, args, event, bot){

        if(args.length < 3){
            bot.sendMessage({
                to: channel,
                message: `:bangbang: You must specify a **user** and an **amount**:\n\`${bot.prefixCache[bot.channels[channel].guild_id]}send @user amount\``
            });
        }else{
            var server = bot.channels[channel].guild_id;
            var amount = parseInt(args[2]);
            if(!amount || amount <= 0){
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: You must specify a valid amount!"
                });
            }else if(amount >= 9007199254740992){
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: You must enter an amount less than 9,007,199,254,740,990"
                });
            }else if(amount > 1000000000000){
				bot.sendMessage({
					to: channel,
					message: ":warning: Balances are capped at **9,007,199,254,740,990**. You will lose money if you attempt to increase someones balance past that point."
				});
			}else{
                var to = args[1].replace(/[@<>!]/g, "");
                if (!bot.users[to]){
                    bot.sendMessage({
                        to: channel,
                        message: ":bangbang: You must specify a valid user!"
                    });
                }else{
                    bot.database.getBalance(userID, server)
                        .then(function (result) {
                            if (result[0].balance >= amount) {
                                return bot.database.useServerCurrency(server).then(function(result){
                                   var shouldUseServerCurrency = !!result[0].useServerCurrency;
                                    return bot.database.transact(userID, to, amount, shouldUseServerCurrency ? server : null);
                                });
                            }else{
                                bot.getCurrencyFor(server, amount).then(function(currency){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:bangbang: You don't have enough for that! You only have **${result[0].balance}** ${currency}.`
                                    });
                                });
                            }
                        })
                        .then(function(sent){
                            if(sent) {
                                bot.getCurrencyFor(server, amount).then(function(currency){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:dollar: Sent **${bot.users[to].username}** **${amount}** ${currency}.`
                                    });
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