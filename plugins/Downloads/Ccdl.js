import { capcutdl } from "../../functions/Fall.js";

export default {
	command: ".ccdl",
	name: "「 CAPCUT DOWNLOADS 」",
	description: "Mengunduh video template dari capcut.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args
			const urlMatch = text.match(/^.ccdl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url) {
				return await sock.reply(
					"⚠️ Mohon sertakan link YouTube yang valid!",
				);
			}

			await sock.reply("⏳ Tunggu sebentar, sedang mengambil video...");

			let res = await capcutdl(url);
			await sock.sendMessage(
				sender,
				{
					video: { url: res.originalVideoUrl },
					caption: "Capcut downloader",
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.reply("⚠️ Terjadi kesalahan! Coba lagi nanti.");
		}
	},
};
