/**
 * Created by Peter on 12/06/2017.
 */
module.exports = {
    name: "Use Item",
    usage: "use [inv slot]",
    accessLevel: 0,
    commands: ["use"],
    run: function run(user, userID, channel, message, args, event, bot) {
        if(args[1]){
            var slot = parseInt(args[1]);
            if(slot && slot > 0){
                slot--;
                bot.database.getInventory(userID)
                    .then(function(inventory){
                       if(inventory[slot]){
                            var itemID = inventory[slot].id;
                            if(bot.items[itemID]){
                                bot.items[itemID](userID, channel);
                            }else{
                                bot.warn(`${userID} tried to use item ${itemID} with no action assigned.`);
                                bot.sendMessage({
                                    to: channel,
                                    message: ":warning: That item doesn't have a defined action!"
                                });
                            }

                       }else{
                            bot.sendMessage({
                                to: channel,
                                message: ":bangbang: You don't have anything in that slot! Take a look at !inventory"
                            });
                       }
                    })
                    .catch(function(err){
                        bot.sendMessage({
                            to: channel,
                            message: `:bangbang: Something went wrong... \n${err}`
                        });
                        bot.log("Error "+err);
                    });
            }else{
                bot.sendMessage({
                    to: channel,
                    message: ":bangbang: You must enter a valid slot number!"
                });
            }
        }else{
            bot.sendMessage({
                to: channel,
                message: ":bangbang: You must enter a slot number. Take a look at !inventory"
            });
        }
    }
};