/**
 * Created by Peter on 07/06/2017.
 */
module.exports = function(bot) {
    return {
        name: "Language Module",
        enabled: true,
        init: function init(cb) {
            bot.langTable = {};
            bot.langTable["en-US"] = {
                GENERIC_ERR_INVALID_AMOUNT:     ":bangbang: You must enter a valid amount!",
                GENERIC_ERR_INVALID_USER:       ":bangbang: You must specify a valid user!",
                SETTINGS_NAME:                  "Server Settings",
                SETTINGS_USAGE:                 "settings [set/help/list]",
                SETTINGS_USESERVERCURRENCY:     "Enable/disable server currency. Disallows global currency trading on this server, but allows for server currency to be used and given out by server admins.",
                SETTINGS_LOTTERYCHANNEL:        "The channel to announce the lottery in. Set this to 'null' to not get lottery announcements.",
                SETTINGS_SERVERCURRENCYNAME:    "The name of your server's currency. This must be **singular** i.e *EthanBuck* not *EthanBucks*.",
                SETTINGS_USEPLURALCURRENCY:     "Adds an S to the end of multiples of the currency, disable this if you use a word like 'Sheep' or 'USD'",
                SETTINGS_USEDAILYREWARD:        "Give everyone a daily balance of whatever is in `dailyBalanceAmount`, every day. Obviously.",
                SETTINGS_DAILYREWARDAMOUNT:     "The amount to give to all users every day.",
                SETTINGS_DAILYREWARDROLES:      "Use roles for daily rewards. Set with !settings rewardroles [role] [amount]",
                SETTINGS_USEROLEREWARDS:        "Use roles for setting role rewards instead of a fixed rate.",
                SETTINGS_AVAILABLESETTINGS:     "**Available Settings:**\n",
                SETTINGS_ERR_NO_SET_VALUE:      ":bangbang: You must supply a **setting** and a **value**:\n!settings set useServerCurrency false",
                SETTINGS_ERR_SET_DB_ERR:        "Error setting value. Did you spell something wrong?:\n`%s`",
                SETTINGS_ERR_INVALID_SETTING:   ":bangbang: Not a valid setting. Try !settings list",
                SETTINGS_SUCCESS_SET_VALUE:     ":white_check_mark: Successfully set value.",
                SETTINGS_ERR_RR_INVALID_ARGS:   ":bangbang: You must supply a role and an amount: !settings rewardroles @Admin 100",
                SETTINGS_ERR_RR_INVALID_ROLE:   ":bangbang: Invalid role. Make sure the role is mentionable and mentioned like !settings rewardroles @Admin 100",
                SETTINGS_ERR_RR_SET_DB_ERR:     ":bangbang: Error setting role reward:\n%s",
                SETTINGS_SUCCESS_SET_RR:        ":white_check_mark: Successfully set <&@%s>'s daily reward to %u %s.",
                SETTINGS_ERR_NOPERMS:           ":bangbang: You don't have permission to run this command! Only the server owner or people with the 'Bot Controller' role can do that.",
                SETTINGS_HELP:                  "**Usage:**\n!settings help [setting] - This message or help on an individual setting\n!settings list - List the available settings and their current values\n!settings set [setting] [value] - Set a new value for a server setting\n!settings rolerewards [role] [amount]",
                SEND_ERR_INVALID_ARGS:          ":bangbang: You must specify a **user** and an **amount**:\n`send @user amount`",
                SEND_ERR_NOT_ENOUGH:            ":bangbang: You don't have enough for that! You only have **%u** %s.",
                SEND_ERR_DB:                    ":bangbang: **Error sending money, you have not been charged**.\n`%s`",
                SEND_SUCCESS:                   ":dollar: Sent **%s** **%u** %s.",
                STATS_TOTAL_SERVERS:            "Total Servers",
                STATS_TOTAL_USERS:              "Total Users",
                STATS_CURRENT_UPTIME:           "Current Uptime",
                STATS_CURRENT_UPTIME_TEXT:      "%u minutes",
                STATS_MESSAGE_STATS:            "Message Stats",
                STATS_MESSAGE_STATS_TEXT:       "**%u** total messages sent this session. **%u ms** average response time",
                STATS_TOTAL_BALANCE:            "Total Balance",
                STATS_BALANCE_TEXT:              "%u %ss",
                STATS_AVERAGE_BALANCE:          "Average Balance",
                STATS_TITLE:                    "EthanBot Statistics",
            }
        }
    }
};