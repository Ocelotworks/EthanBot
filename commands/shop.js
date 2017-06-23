/**
 * Created by Peter on 12/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Shop Command",
    usage: "shop [buy/list/info]",
    accessLevel: 0,
    commands: ["shop"],
    run: function run(user, userID, channel, message, args, event, bot) {
        if(args[1]){
            var server = bot.channels[channel].guild_id;
            var command = args[1].toLowerCase();
            if(command === "list"){
                var currency;
                bot.database.getServerCurrency(server)
                    .then(function(result){
                        currency = result[0].serverCurrencyName + (result[0].usePluralCurrency ? "s":"");
                        return bot.database.getShopItems();
                    })
                    .then(function(result){
                        var fields = [];
                        for(var i in result){
                            if(result.hasOwnProperty(i)) {
                                var item = result[i];
                                fields.push({
                                    name: `${item.name} __[${item.id}]__`,
                                    value: `${item.price} ${currency}`,
                                    inline: true
                                });
                            }
                        }
                        bot.sendMessage({
                            to: channel,
                            message: "-\nEnter **!shop buy [number]** to purchase\nor **!shop info [number]** for more information.",
                            embed: {
                                color: 0x189F06,
                                title: "Available Items:",
                                description: "",
                                fields: fields
                            }
                        });
                    })
            }else if(command === "buy"){
                if(args[2]){
                    var id = parseInt(args[2]);
                    if(id && id > 0){
                        var cost, balance;
                        bot.database.getItemCost(id)
                            .then(function(result){
                                if(result[0]){
                                    cost = result[0].price;
                                    return bot.database.getBalance(userID, server);
                                }else{
                                    bot.sendMessage({
                                        to: channel,
                                        message: ":bangbang: You must enter a valid ID!"
                                    });
                                }
                            })
                            .then(function(result){
                                if(result) {
                                    bot.log(result);
                                    balance = result[0].balance;
                                    if (balance >= cost) {
                                        return bot.database.giveItem(userID, id);
                                    } else {
                                        return bot.getCurrencyFor(server, cost);
                                    }
                                }
                            })
                            .then(function(result){
                                if(result && typeof result == "string"){ //fuckin promises
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:bangbang: You can't afford that. You only have **${balance}** ${result ? result : "EthanBucks"}.`
                                    });
                                }else if(result){
                                    return bot.database.addBalance(userID, -cost);
                                }
                            })
                            .then(function(result){
                                if(result){
                                    return bot.database.logTransaction(userID, ("shop-"+id+"================").substring(0, 18), cost, "other");
                                }
                            })
                            .then(function(result){
                                if(result){
                                    return bot.database.getItemDetails(id);
                                }
                            })
                            .then(function(result){
                                if(result) {
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:moneybag: Successfully purchased **${result[0].name}**.`
                                    });
                                }
                            })
                            .catch(function(err){
                               bot.sendMessage({
                                   to: channel,
                                   message: ":bangbang: Error accessing the shop. Please try again later."
                               });
                               console.error("Shop error "+err);
                            });
                    }else{
                        bot.sendMessage({
                            to: channel,
                            message: ":bangbang: You must enter a valid ID!"
                        });
                    }
                }else{
                    bot.sendMessage({
                        to: channel,
                        message: ":bangbang: You must enter an ID!\nExample: `!shop buy 1` Will buy you a Crate Key."
                    });
                }
            }else{
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: Try **!shop list**"
                });
            }

        }else{
            bot.sendMessage({
                to: channel,
                message: ":bangbang: Try **!shop list**"
            });
        }


    }
};


