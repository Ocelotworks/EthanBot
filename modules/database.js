/**
 * Created by Peter on 07/06/2017.
 */

const config = require('config');
const pasync = require('promise-async');
var knex = require('knex')(config.get("Database"));
module.exports = function(bot){
    return {
        name: "Database Module",
        enabled: true,
        init: function init(cb){
            const USERS_TABLE           = "eb_users";
            const SERVER_BALANCE_TABLE  = "eb_server_balances";
            const TRANSACTIONS_TABLE    = "eb_transactions";
            const SERVERS_TABLE         = "eb_servers";
            const LOTTERY_TABLE         = "eb_lottery";
            const REWARDS_TABLE         = "eb_rewardroles";
            const SHOP_TABLE            = "eb_shop";
            const INVENTORY_TABLE       = "eb_inventory";
            const LOG_TABLE             = "eb_logs";
            const COMMANDLOG_TABLE      = "commandlog";


            bot.getCurrencyFor = function getCurrencyFor(server, amount){
                return bot.database.getServerCurrency(server).then(function(result){
                    return (result[0] ? result[0].serverCurrencyName : "EthanBuck") + (amount  !== 1 && result[0].usePluralCurrency ? "s" : "");
                });
            };

            bot.database = {
                knex: knex,
                addServer: function addNewServer(serverID, addedBy){
                    return knex.insert({
                        server: serverID,
                        addedby: addedBy
                    }).into(SERVERS_TABLE);
                },
                getServer: function getServer(serverID){
                    return knex.select().from(SERVERS_TABLE).where({server: serverID}).limit(1);
                },
                setServerSetting: function setServerSetting(server, setting, value){
                    return knex(SERVERS_TABLE).update(setting, value).where({server: server}).limit(1);
                },
                getServerCurrency: function getServerCurrency(server){
                  return knex.select("serverCurrencyName", "usePluralCurrency").from(SERVERS_TABLE).where({server: server}).limit(1);
                },
                getServers: function getServers(){
                    return knex.select().from(SERVERS_TABLE);
                },
                addUser: function addUser(userID, username, rankOverride){
                    return knex.insert({
                        user: userID,
                        username: username,
                        rank: rankOverride ? rankOverride : 0
                    }).into(USERS_TABLE);
                },
                addAllUsers: function addAllUsers(serverID){
                    var server = bot.servers[serverID];
                    if(server) {
                        bot.database.getServer(serverID)
                            .then(function (result) {
                                if(result[0]){
                                    bot.warn("Tried to add users from server we're already in!");
                                }else{
                                    bot.database.addServer(server.id, server.owner_id)
                                        .then(function(){
                                            bot.log("Added server to database.");
                                        })
                                        .catch(function(err){
                                            bot.error(`Error adding ${server.name} to database: ${err}`);
                                        });
                                    for (var i in server.members) {
                                        if (server.members.hasOwnProperty(i)) {
                                            var username = bot.users[i].username + "#" + bot.users[i].discriminator;
                                            bot.database.addUser(i, username, i === server.owner_id ? "10" : "0")
                                                .then(function () {
                                                    bot.log(`Added user ${i} - ${username}`);
                                                })
                                                .catch(function (err) {
                                                    bot.error("Error adding user " + err)
                                                });
                                        }
                                    }
                                }
                            })
                            .catch(function (err) {
                                bot.error(`Error getting server ${serverID}: ${err.stack}`);
                            });
                    }else{
                        bot.warn("Tried to add users from server that does not exist! "+serverID);
                    }
                },
                getUsers: function getUsers(){
                    return knex.select().from(USERS_TABLE);
                },
                getUser: function getUser(id){
                    return knex.select().from(USERS_TABLE).where({user: id}).limit(1);
                },
                getRoleReward: function getRoleReward(server, role){
                    return knex.select("amount").from(REWARDS_TABLE).where({server: server, role: role}).limit(1);
                },
                getRoleRewards: function getRoleRewards(server){
                    return knex.select("role", "amount").from(REWARDS_TABLE).where({server: server});
                },
                getRewardServers: function getRewardServers(){
                    return knex.select("server", "dailyRewardAmount", "useRoleRewards").from(SERVERS_TABLE).where({useDailyReward: 1, useServerCurrency: 1});
                },
                setRoleReward: function setRoleReward(server, role, amount){
                    return bot.database.getRoleReward(server, role)
                        .then(function(result){
                            if(!result[0]){
                                return knex.insert({server: server, role: role, amount: amount}).into(REWARDS_TABLE);
                            }else{
                                return knex(REWARDS_TABLE).update({amount: amount}).limit(1);
                            }
                        });
                },
                getBalance: function getBalance(user, server){
                    if(server){
                        return knex.select("useServerCurrency").from(SERVERS_TABLE).where({server: server}).limit(1).then(function(result){
                            var useServerCurrency = !!result[0].useServerCurrency;
                            if(useServerCurrency){
                                return knex.select("balance")
                                    .from(SERVER_BALANCE_TABLE)
                                    .where({user: user, server: server})
                                    .limit(1);
                            }else{
                                return knex.select("balance")
                                    .from(USERS_TABLE)
                                    .where({user: user})
                                    .limit(1)
                            }
                        });
                    }else
                        return knex.select("balance")
                            .from(USERS_TABLE)
                            .where({user: user})
                            .limit(1);
                },
                setBalance: function setBalance(user, amount, server){
                    return knex(server ? SERVER_BALANCE_TABLE : USERS_TABLE)
                        .update({balance: amount})
                        .where(server ? {user: user, server: server} : {user: user})
                        .limit(1);
                },
                useServerCurrency: function useServerCurrency(server){
                    return knex.select("useServerCurrency").from(SERVERS_TABLE).where({server: server}).limit(1)
                },
                addBalance: function addBalance(user, amount, server){
                    return bot.database.setBalance(user,
                        knex.raw("("+knex.select("balance")
                                .where(server ? {user: user, server: server} : {user: user})
                                .limit(1)+")" + "+" + amount), server);
                },
                createServerUser: function createServerUser(server, user, username){
                    return knex.insert({
                        user: user,
                        username: username,
                        server: server,

                    }).into(SERVER_BALANCE_TABLE);
                },
                setupServerCurrency: function setupServerCurrency(server, balance){
                    var users = Object.keys(bot.servers[server].members);
                    bot.log("Setting up server currency for "+server);
                    return pasync.eachSeries(users, function(user, cb){
                        bot.log("Adding user "+user);
                        knex.insert({
                            server: server,
                            user: user,
                            username: bot.users[user].username+"#"+bot.users[user].discriminator,
                            balance: balance
                        }).into(SERVER_BALANCE_TABLE).asCallback(function(){cb();});
                    }).then(function(){
                        return bot.database.setServerSetting(server, "useServerCurrency", 1);
                    });
                },
                transact: function transact(from, to, amount, server){
                    return bot.database.addBalance(to, amount, server).then(function(){
                        if(from.indexOf("=") === -1)
                            return bot.database.addBalance(from, -amount, server)

                    }).then(function(){
                        return bot.database.logTransaction(from, to, amount, "transfer");
                    });
                },
                getLotteryInfo: function getLotteryInfo(){
                    return knex.select(knex.raw("COUNT(*) as entries, SUM(amount) as total, AVG(amount) as averageBet")).from(LOTTERY_TABLE);
                },
                enterLottery: function enterLottery(user, amount){
                     return knex.insert({user: user, amount: amount}).into(LOTTERY_TABLE)
                         .then(function(){
                            return bot.database.logTransaction(user, "lottery", amount);
                         });
                },
                pickLotteryWinner: function pickLotteryWinner(){
                    return knex.select("user").from(LOTTERY_TABLE).orderByRaw("-LOG(1.0 - RAND()) / (amount) ASC").limit(1);
                },
                awardLotteryMoney: function awardLotteryMoney(user){
                    var amount;
                    return knex.select(knex.raw("SUM(amount) AS total")).from(LOTTERY_TABLE)
                        .then(function(result){
                            amount = result[0].total;
                            return bot.database.addBalance(user, amount);
                        })
                        .then(function(){
                            return knex.delete().from(LOTTERY_TABLE);
                        })
                        .then(function(){
                            return bot.database.logTransaction("lottery", user, amount);
                        });
                },
                getServersWithSetting: function getServersWithSetting(setting){
                    return knex.select().from(SERVERS_TABLE).whereNotNull(setting).andWhereNot(setting, 0);
                },
                logTransaction: function logTransaction(from, to, amount, type){
                    return knex.insert({
                        from: from === "lottery" ? "lottery===========" : from,
                        to: to === "lottery" ? "lottery===========" : to,
                        amount: amount,
                        type: type ? type : "lottery"
                    }).into(TRANSACTIONS_TABLE);
                },
                getStats: function getStats(){
                    return knex.select(knex.raw("SUM(balance) as totalBalance, AVG(balance) AS averageBalance")).from(USERS_TABLE);
                },
                getShopItems: function getShopItems(){
                    return knex.select("id", "name", "price").from(SHOP_TABLE).where({visible: 1});
                },
                getItemDetails: function getItemDetails(id){
                    return knex.select().from(SHOP_TABLE).where({id: id}).limit(1);
                },
                getItemCost: function getItemCost(id){
                    return knex.select("price").from(SHOP_TABLE).where({id: id, visible: 1}).limit(1);
                },
                giveItem: function giveItem(user, id){
                    return knex.insert({
                        user: user,
                        item: id
                    }).into(INVENTORY_TABLE);
                },
                hasItem: function hasItem(user, id){
                    return knex.select().from(INVENTORY_TABLE).where({user: user, item: id}).limit(1)
                        .then(function(result){
                            return !!result[0];
                        });
                },
                consumeItem: function consumeItem(user, id){
                    //Weird ass workaround needed because LIMIT doesnt work
                    return knex.raw(knex.delete().from(INVENTORY_TABLE).where({user: user, item: id}).toString()+" LIMIT 1");
                },
                getInventory: function getInventory(user){
                    return knex.select(knex.raw("COUNT(*) as amount"), SHOP_TABLE+".name", SHOP_TABLE+".id")
                        .from(INVENTORY_TABLE)
                        .innerJoin(SHOP_TABLE, INVENTORY_TABLE+".item", SHOP_TABLE+".id")
                        .groupBy("item")
                        .orderBy("item")
                        .where({
                            user: user
                        });

                },
                getPrefixes: function getPrefixes(){
                    return knex.select("server","prefix").from(SERVERS_TABLE);
                },
                getServersWithNoLotteryChannel: function getServersWithNoLotteryChannel(){
                    return knex.select("server").from(SERVERS_TABLE).whereNull("lotteryChannel");
                },
                getLeaderboard: function getLeaderboard(server){
                    if(!server){
                        return knex.select("username", "balance", "user").from(USERS_TABLE).orderBy("balance", "DESC").limit(10);
                    }
                },
                log: function log(origin, message, level){
                    return knex.insert({
                        level: level || "info",
                        origin: ""+origin,
                        message: ""+message
                    }).into(LOG_TABLE);
                },
                logCommand: function(user, channel, command){
                    return knex.insert({
                        command: command,
                        userID: user,
                        channelID: channel,
                        server: "ethanbot-0"
                    }).into(COMMANDLOG_TABLE);
                }
            };

            cb();
        }
    }
};