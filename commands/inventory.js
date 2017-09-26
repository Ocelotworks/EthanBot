/**
 * Created by Peter on 12/06/2017.
 */

const numbers = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

module.exports = {
    name: "View Inventory",
    usage: "inventory [@user]",
    accessLevel: 0,
    commands: ["inventory", "inv"],
    run: function run(user, userID, channel, message, args, event, bot) {
        var target = userID;
        var server = bot.channels[channel].guild_id;

        if(args[1] && args[1].startsWith("<")){
            target = args[1].replace(/[<>@!]/g, "");
        }
        var currency;
        bot.database.getServerCurrency(server)
            .then(function(result){
                currency = result[0].serverCurrencyName + (result[0].usePluralCurrency ? "s": "");
                return bot.database.getInventory(target)
            })
            .then(async function(result){
                if(result.length == 0){
                    bot.sendMessage({
                        to: channel,
                        message: `:spider_web: <@${target}>'s Inventory is empty! ${userID == target ? `Maybe check out ${bot.prefixCache[server]}shop?` : ""}`
                    });
                }else{
                    const invSize = await bot.database.getInventorySize(target);
                    const maxInv = await bot.database.getMaxInventorySize(target);
                    var output = `**<@${target}>'s Inventory:** `;
                    if(invSize < maxInv-10){
                    	output+= `(${invSize}/${maxInv} spaces used)\n`;
					}else{
						output+= `**(${invSize}/${maxInv} spaces used) :warning: To buy more inventory space, buy and use an inventory extender.**\n`;
					}
                    for(var i in result){
                        if(result.hasOwnProperty(i)) {
                            var item = result[i];
                            output += `${numbers[i]} \`${item.amount}x\` **${item.name.replace("%CURRENCY", currency)}**\n`;
                        }
                    }
                    bot.sendMessage({
                        to: channel,
                        message: output
                    });
                }
            });
    }
};