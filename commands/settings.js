/**
 * Created by Peter on 09/06/2017.
 */
module.exports = {
    name: "Server Settings",
    usage: "settings [set/help/list]",
    accessLevel: 1,
    commands: ["settings", "serversettings"],
    run: function run(user, userID, channel, message, args, event, bot) {
        var server = bot.channels[channel].guild_id;
        const settings = {
            useServerCurrency: {
                format: function format(value){
                    return !!value;
                },
                onSet: function(newVal){
                    if(newVal == "true"){
                        bot.database.setupServerCurrency(server, 0);
                    }
                },
                explanation: "Enable/disable server currency. Disallows global currency trading on this server, but allows for server currency to be used and given out by server admins."
            },
            lotteryChannel: {
                format: function format(value){
                    return "<#"+value+">"
                },
                explanation: "The channel to announce the lottery in. Set this to 'null' to not get lottery announcements."
            },
            serverCurrencyName: {
                explanation: "The name of your server's currency. This must be **singular** i.e *EthanBuck* not *EthanBucks*.",
                format: function format(value){
                    return "`"+value+"`"
                }
            },
            usePluralCurrency: {
                explanation: "Adds an S to the end of multiples of the currency, disable this if you use a word like 'Sheep' or 'USD'",
                format: function format(value){
                    return !!value;
                }
            }
        };
        bot.database.getServer(server)
            .then(function(results){
                var serverInfo = results[0];
                var hasRole = false;

                var subCommands = {
                    "list": function(){
                        var output = "**Available Settings:**\n";
                        for(var i in serverInfo){
                            if(serverInfo.hasOwnProperty(i) && settings[i]){
                                output += `**${i}** - ${settings[i].format(serverInfo[i])}\n`
                            }
                        }
                        bot.sendMessage({
                            to: channel,
                            message: output
                        });
                    },
                    "set": function(){
                        if(args.length < 4){
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: You must supply a **setting** and a **value**:\n!settings set useServerCurrency false"
                            });
                        }else if(Object.keys(settings).indexOf(args[2]) > -1){
                            bot.database.setServerSetting(server, args[2], args[3] === "true" || args[3] === "false" ? args[3] === "true" : args[3])
                                .then(function(){
                                    bot.sendMessage({
                                        to: channel,
                                        message: ":white_check_mark: Successfully set value."
                                    });
                                    if(settings[args[2]].onSet)
                                        settings[args[2]].onSet(args[3]);
                                })
                                .catch(function(err){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `Error setting value. Did you spell something wrong?:\n\`${err}\``
                                    })
                                });
                        }else{
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: Not a valid setting. Try !settings list"
                            });
                        }
                    },
                    "help": function(){
                        if(Object.keys(settings).indexOf(args[2]) > -1){
                            bot.sendMessage({
                                to: channel,
                                message: settings[args[2]].explanation
                            });
                        }else{
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: Not a valid setting. Try !settings list."
                            });
                            bot.log(args[3]);
                        }
                    }
                };

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
                        message: ":bangbang: You don't have permission to run this command! Only the server owner or people with the 'Bot Controller' role can do that."
                    });
                }else{
                    if(!args[1] || (args[1] === "help" && !args[2]) || !subCommands[args[1]]){
                        bot.sendMessage({
                            to: channel,
                            message: "**Usage:**\n!settings help [setting] - This message or help on an individual setting\n!settings list - List the available settings and their current values\n!settings set [setting] [value] - Set a new value for a server setting"
                        });
                    }else{
                        subCommands[args[1]]();
                    }

                }
            })

    }
};