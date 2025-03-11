import axios from "axios";

export default {
	command: ".pins",
	name: "「 PINTEREST SEARCH 」",
	description: "Mencari gambar dari Pinterest",
	execute: async (sock, sender, text, msg) => {
		try {
			const queryMatch = text.match(/^.pins\s+(.+)/);
			const query = queryMatch ? queryMatch[1] : null;

			// Cek apakah query valid
			if (!query) {
				await sock.reply("⚠️ Harap masukkan query Pinterest!");
				return;
			}

			await sock.reply("⏳ Tunggu sebentar, sedang mengambil image...");

			// Ambil data dari API
			const response = await axios.get(
				`https://fastrestapis.fasturl.cloud/search/pinterest?name=${encodeURIComponent(
					query,
				)}`,
			);

			// Cek apakah response valid
			if (
				response.data.status !== 200 ||
				!response.data.result ||
				response.data.result.length === 0
			) {
				return sock.sendMessage(
					sender,
					{ text: "Tidak ada hasil ditemukan." },
					{ quoted: msg },
				);
			}

			const pins = response.data.result.map((pin) => ({
				header: "Pinterest Image",
				title: "Klik untuk melihat",
				description: pin.link,
				id: `.pindl ${pin.link}`,
			}));

			await sock.sendMessage(
				sender,
				{
					image: { url: response.data.result[0].directLink },
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl: response.data.result[0].link,
							title: "「 Padz x Bro Bot 」",
							body: "Pinterest Search Result",
							sourceUrl: response.data.result[0].link,
							thumbnailUrl: response.data.result[0].directLink,
							renderLargerThumbnail: true,
						},
					},
					caption: `🔍 *Hasil pencarian untuk:* ${query}`,
					footer: `© Bro Bot`,
					mentionedJid: [`${sender}`],
					buttons: [
						{
							buttonId: "action",
							buttonText: { displayText: "Lihat Semua" },
							type: 4,
							nativeFlowInfo: {
								name: "single_select",
								paramsJson: JSON.stringify({
									title: "Pinterest Results",
									sections: [
										{
											title: "Hasil Pencarian",
											highlight_label: "",
											rows: pins,
										},
									],
								}),
							},
						},
					],
					headerType: 1,
					viewOnce: true,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error(error);
			await sock.reply("⚠️ Terjadi kesalahan! Coba lagi nanti.");
		}
	},
};
