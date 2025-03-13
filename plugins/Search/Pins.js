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
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan query Pinterest!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil gambar...",
			});

			// Ambil data dari API
			const response = await axios.get(
				`https://fastrestapis.fasturl.cloud/search/pinterest?name=${encodeURIComponent(
					query,
				)}`,
			);

			// Validasi response API
			if (!response.data.result || response.data.result.length === 0) {
				return sock.sendMessage(
					sender,
					{ text: "⚠️ Tidak ada hasil ditemukan." },
					{ quoted: msg },
				);
			}

			// Ambil hasil pencarian (maksimal 5 gambar)
			const images = response.data.result;

			// Buat daftar cards
			const cards = images.map((img, index) => ({
				image: { url: img.directLink },
				title: `Hasil #${index + 1}`,
				caption: `🔍 *Pencarian:* ${query}\n🔗 *Sumber:* ${img.link}`,
				footer: "Pinterest Search",
				buttons: [
					{
						name: "quick_reply",
						buttonParamsJson: JSON.stringify({
							display_text: "Download Gambar",
							id: `.pindl ${img.link}`,
						}),
					},
					{
						name: "cta_url",
						buttonParamsJson: JSON.stringify({
							display_text: "Buka di Pinterest",
							url: img.link,
						}),
					},
				],
			}));

			// Kirim pesan dengan cards
			await sock.sendMessage(
				sender,
				{
					text: `🔍 *Hasil pencarian untuk:* ${query}`,
					footer: "© Bro Bot",
					cards: cards,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
