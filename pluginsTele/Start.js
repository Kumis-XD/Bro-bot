export default {
	command: "/start",
	execute: async (bot, chatId) => {
		bot.sendMessage(chatId, "Hai! Selamat datang di Bro Bot! 🚀");
	},
};
