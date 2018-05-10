/**
 * Created by Peter on 12/06/2017.
 */
const async = require('async');
module.exports = function(bot) {
    return {
        name: "Item Consumption",
        enabled: true,
        init: function init(cb) {

            const   ITEM_CRATE_KEY = 1,
                    ITEM_GUN = 2,
                    ITEM_CRATE = 3,
                    ITEM_CREDIT_CARD = 4,
                    ITEM_BAG = 5,
                    ITEM_FAIRY = 6,
                    ITEM_SPAGHETTI = 7,
                    ITEM_INV_EXENTENDER = 9;

            bot.CRATE_CONTENTS =  [
            	7, 7, 7, 7, 7, 7, 7,
				1, 1, 1, 1,
				2, 2, 2,
				3,
				4, 4, 4, 4,
				5, 5, 5,
				6, 6
			];

            bot.items = [];


            var spagDelay = {};

            bot.items[ITEM_CRATE_KEY] = async function(user, channel){
                var currency;
				if(await bot.database.isInventoryFull(user)){
					bot.sendMessage({
						to: channel,
						message: "You can't open this crate because your inventory is full!\nIf you filled your inventory with crates and keys then... well.. sucks to be you."
					})
				}else{
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
							return bot.database.getServerCurrency(bot.channels[channel].guild_id);
						})
						.then(function(result){
							currency = result[0].serverCurrencyName + (result[0].usePluralCurrency ? "s": "");
							var itemID = bot.CRATE_CONTENTS[parseInt(Math.random()*bot.CRATE_CONTENTS.length)];
							return bot.database.getItemDetails(itemID);
						})
						.then(function(result){
							bot.sendMessage({
								to: channel,
								message: `:gift: The crate contained a **${(result[0].name).replace("%CURRENCY", currency)}**!`
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
				}
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
                    if(!err) {
                        var id = resp.id;
                        var succeeds = Math.random() > 0.9;
                        async.eachSeries([
                            function (cb) {
                                bot.editMessage({
                                    channelID: channel,
                                    messageID: id,
                                    message: ":gun: You take the gun into your nearest branch..."
                                }, cb);
                            },
                            function (cb) {
                                bot.editMessage({
                                    channelID: channel,
                                    messageID: id,
                                    message: ":gun: " + (succeeds ? "Huh. It's surprisingly easy to rob a bank." : "Well that didn't go as planned...")
                                }, cb);
                            },
                            function (cb) {
                                bot.editMessage({
                                    channelID: channel,
                                    messageID: id,
                                    message: ":gun: " + (succeeds ? "Best get rid of this **Gun**. It's got your fingerprints all over it." : "The police take your gun, but let you go with a fine.")
                                }, cb);
                            }
                        ], function (func, cb) {
                            setTimeout(function () {
                                func(cb);
                            }, 2000);
                        },async function () {
                        	try{
								var amount = parseInt(Math.random() > 0.9 ? (Math.random() * 10000) + 500 : (Math.random() * 2500) + 100);
								var server = bot.channels[channel].guild_id;
								var currency = await bot.getCurrencyFor(server, amount);
								if(succeeds){
									bot.sendMessage({
										to: channel,
										message: `:dollar: <@${user}> gains **${amount}** ${currency} from robbing the bank but loses their gun in the process.`
									});
									await bot.database.addBalance(user, amount);
									await bot.database.logTransaction("bankrob===========", user, amount, "other");
									await bot.database.consumeItem(user, ITEM_GUN);
								}else{
									await bot.database.consumeItem(user, ITEM_GUN);
									await bot.database.addBalance(user, -amount*10);
									bot.sendMessage({
										to: channel,
										message: `:dollar: <@${user}> failed to rob the bank and lost their gun and was fined **${amount * 10}** ${currency}.`
									});
								}
							}catch(e){
								bot.sendMessage({
									to: channel,
									message: ":bangbang: Something went terribly wrong.\n" + e
								});
							}
                        });
                    }else{
                        bot.sendMessage({
                            to: channel,
                            message: ":thinking: Error sending message to discord:\n"+err
                        });
                    }
                });
            };

            bot.items[ITEM_BAG] = function(user, channel){
                var amount = parseInt((Math.random() * 1000) + 1000);
                var server = bot.channels[channel].guild_id;
                bot.getCurrencyFor(server, amount)
                    .then(function(currency){
                        bot.sendMessage({
                            to: channel,
                            message: `:moneybag: The **Bag Of ${currency}** contains **${amount}** ${currency}.`
                        });
                        return bot.database.addBalance(user, amount);
                    })
                    .then(function(){
                        return bot.database.logTransaction("moneybag==========", user, amount, "other");
                    })
                    .then(function(){
                        return bot.database.consumeItem(user, ITEM_BAG);
                    })
                    .catch(function(err){
                        bot.sendMessage({
                            to: channel,
                            message: `:bangbang: Unfortunately the bag burst into flames and you lost everything.\n${err}`
                        });
                    });
            };

            bot.items[ITEM_CREDIT_CARD] = function(user, channel){
                var amount = parseInt((Math.random() * 5000) + 1000);
                var server = bot.channels[channel].guild_id;
                bot.getCurrencyFor(server, amount)
                    .then(function(currency){
                        bot.sendMessage({
                            to: channel,
                            message: `:credit_card: The **Credit Card** maxes out at **${amount}** ${currency}. I sure hope nobody needed that.`
                        });
                        return bot.database.addBalance(user, amount);
                    })
                    .then(function(){
                        return bot.database.logTransaction("creditcard========", user, amount, "other");
                    })
                    .then(function(){
                        return bot.database.consumeItem(user, ITEM_CREDIT_CARD);
                    })
                    .catch(function(err){
                        bot.sendMessage({
                            to: channel,
                            message: `:bangbang: Unfortunately the credit card burst into flames and you lost everything.\n${err}`
                        });
                    });
            };

            bot.items[ITEM_FAIRY] = function(user, channel){
                var amount = parseInt((Math.random() * 10000) + 5000);
                var server = bot.channels[channel].guild_id;
                bot.getCurrencyFor(server, amount)
                    .then(function(currency){
                        bot.sendMessage({
                            to: channel,
                            message: `:money_with_wings: Oh my god! A money fairy descending from the heavens! It's got **${amount}** ${currency} just for you!`
                        });
                        return bot.database.addBalance(user, amount);
                    })
                    .then(function(){
                        return bot.database.logTransaction("fairy=============", user, amount, "other");
                    })
                    .then(function(){
                        return bot.database.consumeItem(user, ITEM_FAIRY);
                    })
                    .catch(function(err){
                        bot.sendMessage({
                            to: channel,
                            message: `:bangbang: Unfortunately the fairy burst into flames and you lost everything.\n${err}`
                        });
                    });
            };

            bot.items[ITEM_SPAGHETTI] = function(user, channel){
            	const now = new Date().getTime();
            	if(spagDelay[user] && now-spagDelay[user] < 140000){
            		bot.sendMessage({
						to: channel,
						message: `:spaghetti: You're full! You need to wait another **${Math.ceil((140000-(now-spagDelay[user]))/1000/60)} minutes** before you can consume spaghetti again.`
					});
				}else{
					bot.getCurrencyFor(bot.channels[channel].guild_id, 2)
						.then(function(currency){
							bot.sendMessage({
								to: channel,
								message: `:spaghetti: Mmmmmm... Delicious. Well worth my hard earned ${currency}.`
							});
							spagDelay[user] = now;
							return bot.database.consumeItem(user, ITEM_SPAGHETTI);
						})
						.catch(function(err){
							bot.sendMessage({
								to: channel,
								message: `:bangbang: Unfortunately the spaget into flames and you lost everything.\n${err}`
							});
						});
				}

            };


			bot.items[ITEM_INV_EXENTENDER] = async function(user, channel){
				try{
					await bot.database.upgradeInventorysize(user, 50);
					await bot.database.consumeItem(user, ITEM_INV_EXENTENDER);
					bot.sendMessage({
						to: channel,
						message: "Your inventory has been extended successfully."
					});
				}catch(e){
					bot.sendMessage({
						to: channel,
						message: `:bangbang: Unable to use inventory extender. Try again later.`
					});
					console.log("Error using inv extender");
					console.log(e);
				}
			};

            cb();
        }
    }
};