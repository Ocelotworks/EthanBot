/**
 * Created by Peter on 09/06/2017.
 */
const pasync = require('promise-async');
module.exports = {
    name: "Give Money (Server Currency Only)",
    usage: "give @user amount",
    accessLevel: 0,
    commands: ["give"],
    run: function run(user, userID, channel, message, args, event, bot) {
        var server = bot.channels[channel].guild_id;
        bot.database.getServer(server)
            .then(function(result){
                var serverInfo = result[0];
                if(!serverInfo.useServerCurrency){
                    bot.sendMessage({
                        to: channel,
                        message: `:bangbang: This command is only available for Server Currency. A Bot Master can enable this with the \`${bot.prefixCache[server]}settings\` command.`
                    });
                }else{
                    var hasRole = false;
                    for(var i in bot.servers[server].members[userID].roles){
                        var role = bot.servers[server].roles[bot.servers[server].members[userID].roles[i]];
                        if(role.name.toLowerCase() === "bot controller"){
                            hasRole = true;
                            break;
                        }
                    }
                    //noinspection EqualityComparisonWithCoercionJS
                    if(serverInfo.addedby != userID && !hasRole){
                        bot.sendMessage({
                            to: channel,
                            message: ":bangbang: You must be server owner or have the role 'Bot Master' to use this command."
                        });
                    }else if(args[2] && parseInt(args[2])){
                        var amount = parseInt(args[2]);
                        var target = args[1].replace(/[<>@!]/g, "");
                        if(target === "all"){
                            var users = Object.keys(bot.servers[server].members);
                            pasync.eachSeries(users, function(user, callback){
                                bot.database.addBalance(user, amount, server).then(function(){
                                    return bot.database.logTransaction(userID, user, amount, "give");
                                }).asCallback(callback);
                            })
                            .then(function(){
                                return bot.getCurrencyFor(server, amount);
                            })
                            .then(function(currency){
                                bot.sendMessage({
                                    to: channel,
                                    message: `:dollar: Gave ${users.length} users **${amount}** ${currency}`
                                });
                            })
                            .catch(function(err){
                                bot.sendMessage({
                                    to: channel,
                                    message: `:bangbang: Error giving money.\n${err}`
                                })
                            })
                        }else{
                            bot.database.addBalance(target, amount, server)
                                .then(function(){
                                    return bot.getCurrencyFor(server, amount);
                                })
                                .then(function(currency){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:dollar: Gave <@${target}> **${amount}** ${currency}.`
                                    });
                                })
                                .then(function(){
                                    return bot.database.logTransaction(userID, target, amount, "give");
                                })
                                .catch(function(err){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:bangbang: Error giving money.\n \`${err}\``
                                    });
                                });
                        }

                    }else{
                        bot.sendMessage({
                            to: channel,
                            message: `:bangbang: You must enter a valid amount, between -2147483648 and 2147483648.`
                        });
                    }
                }
            });

    }
};