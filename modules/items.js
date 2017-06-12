/**
 * Created by Peter on 12/06/2017.
 */
const async = require('async');
module.exports = function(bot) {
    return {
        name: "Item Consumption",
        enabled: true,
        init: function init(cb) {

            const ITEM_CRATE_KEY = 1;
            const ITEM_GUN = 2;
            const ITEM_CRATE = 3;
            bot.CRATE_CONTENTS = [2, 2, 2, 2, 2, 1];

            bot.items = [];

            bot.items[ITEM_CRATE_KEY] = function(user, channel){
                bot.database.hasItem(user, ITEM_CRATE)
                    .then(function(hasItem){
                        if(!hasItem){
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: You need a **:gift: Crate** to use this item. Buy one with !shop buy "+ITEM_CRATE
                            });
                            throw new Error("No Crate");
                        }else{
                            return bot.database.consumeItem(user, ITEM_CRATE);
                        }
                    })
                    .then(function(){
                        return bot.database.consumeItem(user, ITEM_CRATE_KEY);
                    })
                    .then(function(){
                        var itemID = bot.CRATE_CONTENTS[parseInt(Math.random()*bot.CRATE_CONTENTS.length)];
                        return bot.database.getItemDetails(itemID);
                    })
                    .then(function(result){
                        bot.sendMessage({
                            to: channel,
                            message: `:gift: The crate contained a **${result[0].name}**!`
                        });
                        return bot.database.giveItem(user, result[0].id);
                    })
                    .catch(function(err){
                        if(err.message.indexOf("No Crate") === -1) {
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: Your crate burst into flames, along with the key. Bad luck..."
                            });
                            console.error(err);
                        }
                    });
            };

            bot.items[ITEM_CRATE] = function(user, channel){
                bot.sendMessage({
                    to: channel,
                    message: "You take a long, hard look at your **:gift: Crate**.\n It could make a good chair, but you should probably buy a key and open it instead. \n**Buy and then use a key to unlock this crate. !shop buy "+ITEM_CRATE_KEY+"**"
                });
            };

            bot.items[ITEM_GUN] = function(user, channel){
                bot.sendMessage({
                    to: channel,
                    message: ":gun: What can you do with a gun you ask? Rob a bank!"
                }, function(err, resp){
                    var id = resp.id;
                    var succeeds = Math.random() > 0.5;
                    async.eachSeries([
                        function(cb){
                            bot.editMessage({
                                channelID: channel,
                                messageID: id,
                                message: ":gun: You take the gun into your nearest branch..."
                            }, cb);
                        },
                        function(cb){
                            bot.editMessage({
                                channelID: channel,
                                messageID: id,
                                message: ":gun: "+ (succeeds ? "Huh. It's surprisingly easy to rob a bank." : "Well that didn't go as planned...")
                            }, cb);
                        },
                        function(cb){
                            bot.editMessage({
                                channelID: channel,
                                messageID: id,
                                message: ":gun: "+(succeeds ? "Best get rid of this **Gun**. It's got your fingerprints all over it." : "The police take your gun, but let you go for some reason.")
                            }, cb);
                        }
                    ], function(func, cb){
                        setTimeout(function(){
                            func(cb);
                        }, 2000);
                    }, function(){
                        if(succeeds){
                            var amount = parseInt(Math.random() > 0.1 ? Math.random()*10000+500 : Math.random()*2500+100);
                            var server = bot.channels[channel].guild_id;
                            bot.getCurrencyFor(server, amount)
                                .then(function(currency){
                                    bot.sendMessage({
                                        to: channel,
                                        message: `:dollar: <@${user}> gains **${amount}** ${currency} from robbing the bank but loses their gun in the process.`
                                    });
                                    return bot.database.addBalance(user, amount);
                                })
                                .then(function(){
                                    return bot.database.logTransaction("bankrob===========", user, amount, "other");
                                })
                                .then(function(){
                                    return bot.database.consumeItem(user, ITEM_GUN);
                                })
                                .catch(function(err){
                                    bot.sendMessage({
                                        to: channel,
                                        message: ":bangbang: Something went terribly wrong.\n"+err
                                    });
                                });
                        }else{
                            bot.database.consumeItem(user, ITEM_GUN)
                                .then(function(){
                                   bot.sendMessage({
                                       to: channel,
                                       message: `:dollar: <@${user}> failed to rob the bank and lost their gun...`
                                   });
                                })
                                .catch(function(err){
                                    bot.sendMessage({
                                        to: channel,
                                        message: ":bangbang: Something went terribly wrong.\n"+err
                                    });
                                });
                        }

                    })
                });
            };

            cb();
        }
    }
};