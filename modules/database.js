/**
 * Created by Peter on 07/06/2017.
 */

const config = require('config');
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


            bot.database = {
                addServer: function addNewServer(serverID, addedBy){
                    return knex.insert({
                        server: serverID,
                        addedby: addedBy
                    }).into(SERVERS_TABLE);
                },
                getServer: function getServer(serverID){
                    return knex.select().from(SERVERS_TABLE).where({server: serverID}).limit(1);
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
                                bot.error(`Error getting server ${serverID}: ${err}`);
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
                getBalance: function getBalance(user, server){
                    return knex.select("balance")
                        .from(server ? SERVER_BALANCE_TABLE : USERS_TABLE)
                        .where(server ? {user: user, server: server} : {user: user})
                        .limit(1);
                },
                setBalance: function setBalance(user, amount, server){
                    return knex(server ? SERVER_BALANCE_TABLE : USERS_TABLE)
                        .update({balance: amount})
                        .where(server ? {user: user, server: server} : {user: user})
                        .limit(1);
                },
                addBalance: function addBalance(user, amount, server){
                    return bot.database.setBalance(user,
                        knex.raw("("+knex.select("balance")
                                .where(server ? {user: user, server: server} : {user: user})
                                .limit(1)+")" + "+" + amount), server);
                },
                transact: function transact(from, to, amount, server){
                    return bot.database.addBalance(to, amount, server).then(function(){
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
                    return knex.select("user").from(LOTTERY_TABLE).orderByRaw("-LOG(1.0 - RAND()) / (amount) DESC").limit(1);
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
                logTransaction: function(from, to, amount, type){
                    return knex.insert({
                        from: from === "lottery" ? "lottery===========" : from,
                        to: to === "lottery" ? "lottery===========" : to,
                        amount: amount,
                        type: type ? type : "lottery"
                    }).into(TRANSACTIONS_TABLE);
                },
                getStats: function(){
                    return knex.select(knex.raw("SUM(balance) as totalBalance, AVG(balance) AS averageBalance")).from(USERS_TABLE);
                }
            };

            cb();
        }
    }
};