/**
 * Created by Neil on 24/04/2018.
 */
module.exports = {
    name: "Declare Bankruptcy",
    usage: "bankrupt",
    accessLevel: 0,
    commands: ["bankrupt"],
    run: function run(user, userID, channel, message, args, event, bot) {
		bot.database.getBalance(userID).then(function(result){
			if(result[0] && result[0].balance <= 0){
				bot.database.setBalance(userID, 0).then(function(result){
					bot.database.addBankruptcy(userID).then(function(result){
						bot.database.getBankrupt(userID).then(function(result){
							bot.sendMessage({
								to: channel,
								message: `:dollar: **${Object.keys(bot.servers[bot.channels[channel].guild_id]).indexOf(userID) > -1 ? "<@"+userID+">" : user}** has been bankrupt ${result[0].bankrupt} times!`
							});
						});
					});
				});
			} else {
				bot.sendMessage({
                    to: channel,
                    message: `:dollar: You have to owe money to declare bankruptcy!`
				});
			}
		})
    }
};