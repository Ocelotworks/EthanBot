/**
 * Created by Peter on 12/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Shop Command",
    usage: "shop [buy/list/info]",
    accessLevel: 0,
    commands: ["shop"],
    run: async function run(user, userID, channel, message, args, event, bot) {
        if(args[1]){
			var server = bot.channels[channel].guild_id;
			var command = args[1].toLowerCase();
			if(command === "list"){
				var currency;
				bot.database.getServerCurrency(server)
					.then(function(result){
						currency = result[0].serverCurrencyName + (result[0].usePluralCurrency ? "s" : "");
						return bot.database.getShopItems();
					})
					.then(function(result){
						var fields = [];
						for(var i in result){
							if(result.hasOwnProperty(i)){
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
				try{
					if(!args[2]){
						bot.sendMessage({
							to: channel,
							message: ":bangbang: Try **!shop list**"
						});
					}else if(await bot.database.isInventoryFull(userID)){
						bot.sendMessage({
							to: channel,
							message: ":bangbang: Your inventory is full! You must use some items then purchase and use an inventory extender."
						});
					}else{
						const id = parseInt(args[2]);
						if(!id || id < 0){
							bot.sendMessage({
								to: channel,
								message: ":bangbang: You must enter a valid ID!"
							});
							bot.log("Invalid ID "+id);
						}else{
							const costResult = await bot.database.getItemCost(id);
							// console.log(costResult);
							// console.log(typeof costResult);
							// console.log(costResult.length);
							// console.log(costResult[0]);
							if(!costResult[0]){
								bot.sendMessage({
									to: channel,
									message: ":bangbang: You must enter a valid ID!"
								});
								bot.log("Invalid ID "+costResult+" "+id)
							}else{
								const cost = costResult[0].price;
								const balance = (await bot.database.getBalance(userID))[0].balance;
								if(balance >= cost){
									await bot.database.giveItem(userID, id);
									await bot.database.addBalance(userID, -cost);
									await bot.database.logTransaction(userID, ("shop-" + id + "================").substring(0, 18), cost, "other");
									const itemDetails = await bot.database.getItemDetails(id);
									bot.sendMessage({
										to: channel,
										message: `:moneybag: Successfully purchased **${itemDetails[0].name}**.`
									});
								}else{
									const currency = await bot.getCurrencyFor(server, cost);
									bot.sendMessage({
										to: channel,
										message: `:bangbang: You can't afford that. You only have **${balance}** ${currency ? currency : "EthanBucks"}.`
									});
								}
							}
						}
					}
				}catch(e){
					bot.sendMessage({
						to: channel,
						message: ":bangbang: Error contacting shop. Try again later."
					});
					console.error(e);
				}
			}else{
				bot.sendMessage({
					to: channel,
					message: "Try: !shop list"
				});
			}
		}else{
			bot.sendMessage({
				to: channel,
				message: "Try: !shop list"
			});
		}
    }
};


