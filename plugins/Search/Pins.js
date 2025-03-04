import axios from "axios";

export default {
	command: ".pins",
	name: "「 PINTEREST SEARCH 」",
	description: "Mencari gambar dari pinterest",
	execute: async (sock, sender, text, msg) => {
		try {
			const queryMatch = text.match(/^.pins\s+(.+)/);
			const query = queryMatch ? queryMatch[1] : null;

			// Cek apakah URL valid
			if (!query) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan query Pinterest!",
				});
				return;
			}
			const response = await axios.get(
				`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(
					query,
				)}`,
			);
			if (!response.data.status || !response.data.data.length) {
				return sock.sendMessage(
					sender,
					{ text: "Tidak ada hasil ditemukan." },
					{ quoted: msg },
				);
			}

			const pins = response.data.data.map((pin) => ({
				header: pin.grid_title || "No Title",
				title: pin.created_at,
				description: pin.link || "No Link",
				id: `.pindl ${pin.pin}`,
			}));

			await sock.sendMessage(
				sender,
				{
					image: { url: response.data.data[0].images_url },
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl: response.data.data[0].pin,
							title: "「 Padz x Bro Bot 」",
							body: "Pinterest Search Result",
							sourceUrl: response.data.data[0].pin,
							thumbnailUrl: response.data.data[0].images_url,
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
			await sock.sendMessage(
				sender,
				{
					text: "Terjadi kesalahan saat mengambil data dari Pinterest.",
				},
				{ quoted: msg },
			);
		}
	},
};
