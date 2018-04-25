module.exports = {
    name: "Redeem Daily Reward",
    usage: "daily",
    accessLevel: 0,
    commands: ["daily", "dailyreward", "reward"],
    run: async function run(user, userID, channel, message, args, event, bot) {
        const serverID = bot.channels[channel].guild_id;
        const serverInfoResult = await bot.database.getServer(serverID);
        const useServerCurrency = serverInfoResult[0].useServerCurrency;
        if(useServerCurrency){
            bot.sendMessage({
                to: channel,
                message: ":bangbang: This server uses server currency, so you cannot use this command here!"
            });
        }else{
            const canRedeemDaily = bot.database.canRedeemDaily(userID);
            if(canRedeemDaily){
                await bot.database.resetDaily(userID);
                await bot.database.addBalance(userID, 150);
                bot.sendMessage({
                   to: channel,
                   message: `:dollar: You redeemed your daily reward of **150** ${serverInfoResult.serverCurrencyName + (serverInfoResult.usePluralCurrency ? "s":"")}!\nCome back again in 24 hours for more.`
                });
            }else{
                bot.sendMessage({
                    to: channel,
                    message: ":watch: You've already redeemed your daily reward today, try again tomorrow."
                })
            }
        }
    }
};