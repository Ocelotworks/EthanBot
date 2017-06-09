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

        var server = bot.channels[channel].guild_id;
        bot.database.getBalance(target, server)
            .then(function(result){
                if(!result[0]){
                    bot.log("User doesn't have a thing");

                    if(bot.users[target]){
                        bot.database.createServerUser(server, target, bot.users[target].username+"#"+bot.users[target].discriminator)
                            .then(function(){
                                return bot.getCurrencyFor(server, balance);
                            })
                            .then(function(currency){
                                bot.sendMessage({
                                    to: channel,
                                    message: `:dollar: <@${target}> has **0** ${currency}...`
                                });
                            })
                            .catch(function(err){
                               bot.sendMessage({
                                   to: channel,
                                   message: `:bangbang: Something has gone horribly, horribly wrong. Let Big P#1843 know about this:\n\`\`\`\n${err}\n\`\`\``
                               });
                            });
                    }else{
                        bot.sendMessage({
                            to: channel,
                            message: ":bangbang: That user doesn't exit."
                        });
                    }
                }else{
                    var balance = result[0].balance;
                    bot.getCurrencyFor(server, balance).then(function(currency){
                        bot.sendMessage({
                            to: channel,
                            message: `:dollar: <@${target}> has **${balance}** ${currency}.`
                        });
                    });
                }
            });
    }
};