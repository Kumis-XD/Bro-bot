const { ffStalk } = require("../../functions/Fall.js");

export default {
	command: ".ffs",
	name: "「 FREE FIRE STALK 」",
	description: "Melihat informasi akun dari game Free Fire.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil uid dari args
			const uidMatch = text.match(/^.ffs\s+(.+)/);
			const uid = uidMatch ? uidMatch[1] : null;
			const result = await ffStalk.stalk(uid);
			console.log(result);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
