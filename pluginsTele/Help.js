export default {
	command: "/help",
	execute: async (bot, chatId) => {
		const helpText = `
📌 *Daftar Perintah:*
/start - Memulai bot
/help - Melihat bantuan
Ketik pesan biasa, bot akan mengulanginya.
		`;
		await bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
	},
};
