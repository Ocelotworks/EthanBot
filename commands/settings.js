/**
 * Created by Peter on 09/06/2017.
 */
const pasync = require('promise-async');
module.exports = {
    name: "Server Settings",
    usage: "settings [set/help/list]",
    accessLevel: 1,
    commands: ["settings", "serversettings"],
    init: function init(bot, cb){
        var now = new Date();
        var midnight = new Date();
        midnight.setHours(0, 0, 0);
        if(midnight < now){
            midnight.setDate(midnight.getDate()+1);
        }
        bot.log("Midnight is at "+midnight);

        async function processRoleRewards(members, roleRewards, serverID){
            await pasync.eachSeries(members, async function (member, membersCallback) {
                try {
                    const keys = member.roles;
                    await pasync.eachSeries(roleRewards, async function (roleReward, roleRewardsCallback) {
                        try {
                            if (keys.indexOf(roleReward.role) > -1) {
                                bot.log(`Rewarding ${member.id} ${roleReward.amount} monies in ${serverID}.`);
                                await bot.database.transact("reward============", member.id, roleReward.amount, serverID);
                            }
                        }finally{
                            setTimeout(roleRewardsCallback, 200);
                        }
                    });
                }finally{
                    membersCallback();
                }
            });
        }

        async function processMemberRewards(members,amount,serverID){
            await pasync.eachSeries(members, async function (member, membersCallback) {
                try {
                    await bot.database.transact("reward============", member.id, amount, serverID);
                }catch(err){
                    bot.error(`Error processing member rewards: ${err}`);
                }finally{
                    setTimeout(membersCallback, 200);
                }
            });
        }

        bot.doDailyRewards = async function(){
            const rewardServers = await bot.database.getRewardServers();
            await pasync.eachSeries(rewardServers, async function(server, rewardServersCallback){
                try {
                    const discordServerObject = bot.servers[server.server];
                    if (server.useRoleRewards) {
                        bot.log(`Server ${server.server} uses role rewards.`);
                        if (discordServerObject) {
                            const roleRewards = bot.database.getRoleRewards(server.server);
                            bot.log(`Found ${roleRewards.length} role rewards.`);
                            await processRoleRewards(discordServerObject.members, roleRewards, server.server);
                        } else {
                            bot.log(`Server ${server.server} no longer exists.`);
                        }
                    } else {
                        bot.log(`Server ${server.server} does not use role rewards.`);
                        if (discordServerObject) {
                            await processMemberRewards(discordServerObject.members, server.dailyRewardAmount, server.server);
                        } else {
                            bot.log(`Server ${server.server} no longer exists.`);
                        }
                    }
                }finally{
                    rewardServersCallback();
                }
            });


            bot.database.getRewardServers()
                .then(function(servers){
                    return pasync.eachSeries(servers, function(server, callback){
                        if(server.useRoleRewards) {
                            bot.log("Server " + server.server + " uses role rewards");
                            if (bot.servers[server.server]) {
                                bot.database.getRoleRewards(server.server).then(function (roleRewards) {
                                    bot.log("Found " + roleRewards.length + " role rewards for server ");
                                    return pasync.eachSeries(bot.servers[server.server].members, function (member, cb) {
                                        var keys = member.roles;
                                        pasync.eachSeries(roleRewards, function (roleReward, cb2) {
                                            if (keys.indexOf(roleReward.role) > -1) {
                                                bot.log(`Rewarding ${member.id} ${roleReward.amount} monies in ${server.server}.`);
                                                bot.database.transact("reward============", member.id, roleReward.amount, server.server)
                                                    .then(function () {
                                                        setTimeout(cb2, 200);
                                                    })
                                                    .catch(function (err) {
                                                        bot.error("Failed to give out daily reward: " + err);
                                                        cb2();
                                                    })
                                            } else {
                                                cb2();
                                            }

                                        }).then(function () {
                                            cb();
                                        });
                                    });
                                });
                            }else{
                                bot.log("Server "+server.server+" does not exist anymore :(");
                            }
                        }else{
                            bot.log(`Server ${server.server} does not use role rewards.`);
                            if(bot.servers[server.server]) {
                                return pasync.eachSeries(bot.servers[server.server].members, function (member, cb) {
                                    bot.database.transact("reward============", member.id, server.dailyRewardAmount, server.server)
                                        .then(function () {
                                            setTimeout(cb, 10);
                                        })
                                        .catch(function (err) {
                                            bot.error("Failed to give out daily reward: " + err);
                                            cb();
                                        });
                                });
                            }else{
                                bot.log(`Server ${server.server} doesn't exist anymore.`);
                            }
                        }
                        callback();
                    });
                })
                .catch(function(err){
                    bot.error("Error giving out rewards: "+err);
                });

            setTimeout(bot.doDailyRewards, 8.64e7);//24 hours
        };

        setTimeout(bot.doDailyRewards, midnight-now);
    },
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
            },
            useDailyReward: {
                explanation: "Give everyone a daily balance of whatever is in `dailyBalanceAmount`, every day. Obviously.",
                format: function format(value){
                    return !!value
                }
            },
            dailyRewardAmount: {
                explanation: "The amount to give to all users every day.",
                format: function format(value){
                    return value;
                }
            },
            dailyRewardRoles: {
                explanation: "Use roles for daily rewards. Set with !settings rewardroles [role] [amount]",
                format: function format(value){
                    return !!value
                }
            },
            useRoleRewards: {
                explanation: "Use roles for setting role rewards instead of a fixed rate.",
                format: function format(value){
                    return !!value;
                }
            },
            prefix: {
                explanation: "The prefix that goes before commands i.e !shop or !settings",
                format: function format(value){
                    return "`"+value+"`";
                },
                onSet: function(newVal){
                    bot.prefixCache[server] = newVal;
                },
            }
        };
        bot.database.getServer(server)
            .then(async function(results){
                var serverInfo = results[0];
                var hasRole = false;

                if(!serverInfo){
                	bot.warn("Created server super quick like")
					await bot.database.addServer(server, userID)

                }
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
                                message: `:bangbang: You must supply a **setting** and a **value**:\n${bot.prefixCache[server]}settings set useServerCurrency false`
                            });
                        }else if(Object.keys(settings).indexOf(args[2]) > -1){
                            bot.database.setServerSetting(server, args[2], args[3] === "true" || args[3] === "false" ? args[3] === "true" : args[3])
                                .then(function(){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:white_check_mark: Successfully set ${args[2]} to **${args[3]}**`
                                    });
                                    if(settings[args[2]].onSet)
                                        settings[args[2]].onSet(args[3]);
                                })
                                .catch(function(err){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `Error setting value. Did you spell something wrong?`
                                    });
                                    bot.error("Error setting value: "+err);
                                });
                        }else{
                            bot.sendMessage({
                                to: channel,
                                message: `:bangbang: Not a valid setting. Try ${bot.prefixCache[server]}settings list`
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
                                message: `:bangbang: Not a valid setting. Try ${bot.prefixCache[server]}settings list.`
                            });
                            bot.log(args[3]);
                        }
                    },
                    "rolerewards": function(){
                        if(args.length < 4){
                            bot.sendMessage({
                                to: channel,
                                message: `:bangbang: You must supply a role and an amount: ${bot.prefixCache[server]}settings rewardroles @Admin 100`
                            });
                        }else{
                            var role = args[2].replace(/[<>&@]/g, "");
                            var amount = parseInt(args[3]);
                            if(!amount){
                                bot.sendMessage({
                                    to: channel,
                                    message: ":bangbang: You must enter a valid amount!"
                                });
                            }else if(!bot.servers[server].roles[role]){
                                console.log(role);
                                console.log(bot.servers[server].roles);
                                bot.sendMessage({
                                    to: channel,
                                    message: `:bangbang: Invalid role. Make sure the role is mentionable and mentioned like ${bot.prefixCache[server]}settings rewardroles @Admin 100`
                                });
                            }else{
                                bot.database.setRoleReward(server, role, amount)
                                    .then(function(){
                                        return bot.getCurrencyFor(server, amount);
                                    })
                                    .then(function(currency){
                                        bot.sendMessage({
                                            to: channel,
                                            message: `:white_check_mark: Successfully set <&@${role}>'s daily reward to ${amount} ${currency}.`
                                        });
                                    })
                                    .catch(function(err){
                                        bot.sendMessage({
                                            to: channel,
                                            message: `:bangbang: Error setting role reward:\n${err}`
                                        });
                                        bot.error("Error setting role reward "+err);
                                    });
                            }
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
                            message: "**Usage:**\n!settings help [setting] - This message or help on an individual setting\n!settings list - List the available settings and their current values\n!settings set [setting] [value] - Set a new value for a server setting\n!settings rolerewards [role] [amount]"
                        });
                    }else{
                        subCommands[args[1]]();
                    }

                }
            })

    }
};