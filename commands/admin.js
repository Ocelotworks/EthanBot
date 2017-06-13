/**
 * Created by Peter on 08/06/2017.
 */
const config = require('config');
module.exports = {
    name: "",
    usage: "",
    accessLevel: 10,
    commands: ["admin"],
    run: function run(user, userID, channel, message, args, event, bot){
        //noinspection EqualityComparisonWithCoercionJS
        if(userID == "139871249567318017"){
            var command = args[1];
            switch(command){
                case "leave":
                    bot.leaveServer(args[2]);
                    break;
                case "clearmq":
                    bot.messageQueue = [];
                    bot.sendMessage({
                        to: channel,
                        message: "Done."
                    });
                    break;
                case "eval":
                    eval(message.substring(12));
                    break;
                case "restart":
                    process.exit(1);
                    break;
                case "stats":
                    bot.sendMessage({
                        to: channel,
                        message: `Currently active in **${Object.keys(bot.servers).length}** servers. ${parseInt(process.uptime()/60)} minutes uptime.`
                    });
                    break;
                case "forcelottery":
                    bot.doLottery();
                    break;
                case "forcedaily":
                    bot.doDailyRewards();
                    bot.sendMessage({
                        to: channel,
                        message: "Done."
                    });
                    break;
                case "say":
                    bot.sendMessage({
                        to: channel,
                        message: message.substring(11)
                    });
                    break;
                case "servers":
                    var fields = [];
                    for(var i in bot.servers){
                        var server = bot.servers[i];
                        var field = {
                            name: server.name,
                            value: `**${server.member_count}** members. **${Object.keys(server.channels).length}** channels.`,
                            inline: true
                        };
                        fields.push(field);
                    }
                    bot.sendMessage({
                        to: channel,
                        message: "",
                        embed: {
                            color: 0x189F06,
                            title: `Currently in **${Object.keys(bot.servers).length} servers.**`,
                            description: "",
                            fields: fields
                        }
                    });
                    break;
                case "presence":
                    bot.setPresence({
                        game: {
                            name: message.substring(16)
                        }
                    });
                    break;
                case "broadcast":
                    for(var i in bot.servers){
                       bot.sendMessage({
                           to: Object.keys(bot.servers[i].channels)[0],
                           message: ":bangbang: BROADCAST: "+message.substring(17)
                       });
                    }
                    break;
                case "take":
                    bot.database.transact(args[2].replace(/[!@<>]/g, ""), userID, args[3])
                        .then(function(){
                            bot.sendMessage({
                                to: channel,
                                message: `:dollar: Taken **${args[3]}** ${config.get("Bot.defaultCurrency")}s from <@${args[2]}>`
                            });
                        });
                    break;
                case "reload":
                    try {
                        require.uncache("./"+args[2], function () {
                            var loadedCommand = require("./" + args[2]);
                            bot.sendMessage({
                                to: channel,
                                message: `Loaded command ${loadedCommand.name}`
                            });
                            bot.commandUsages[loadedCommand.name] = {
                                usage: loadedCommand.usage,
                                accessLevel: loadedCommand.accessLevel
                            };
                            for (var i in loadedCommand.commands) {
                                if (loadedCommand.commands.hasOwnProperty(i)) {
                                    bot.commands[loadedCommand.commands[i]] = loadedCommand.run;
                                }

                            }
                        });
                    }catch(e){
                        bot.sendMessage({
                            to: channel,
                            message: e.stack
                        });
                    }
                    break;
                case "pushlottery":
                    const VIABLE_CHANNELS = ["bots", "bot", "shitpost", "shitposting", "spam", "botspam", "bot-spam", "lottery", "dump"];
                    bot.database.getServersWithNoLotteryChannel()
                        .then(function(servers){
                            for(var i in servers) {
                                if (servers.hasOwnProperty(i) && bot.servers[servers[i].server]) {
                                    var serverID = servers[i].server;
                                    var channels = bot.servers[serverID].channels;
                                    for (var j in channels) {
                                        var channel = channels[j];
                                        if(VIABLE_CHANNELS.indexOf(channel.name) > -1){
                                            bot.log("Found channel "+channel.name+" for server "+serverID);
                                            bot.database.setServerSetting(serverID, "lotteryChannel", j)
                                                .then(function(){
                                                    bot.log("Set successfully");
                                                });
                                            break;
                                        }
                                    }
                                }
                            }
                        });

                    break;
                case "giveItem":
                    var currency;
                    var server = bot.channels[channel].guild_id;
                    bot.getCurrencyFor(server, 2)
                        .then(function(result){
                            currency = result;
                            return bot.database.getItemDetails(args[3])
                        })
                        .then(function(result){
                            if(result[0]){
                                bot.sendMessage({
                                    to: channel,
                                    message: `Sent ${args[2]} **${result[0].name.replace("%CURRENCY", currency)}**.`
                                });
                                return bot.database.giveItem(args[2].replace(/[@!<>]/g, ""));
                            }else{
                                throw new Error("No such item");
                            }
                        })
                        .catch(function(err){
                            bot.sendMessage({
                                to: channel,
                                message: err.stack
                            });
                        })

            }
        }

    }
};

require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};

require.uncache = function uncache(moduleName, cb) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
        if(cb)
            cb();
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
}