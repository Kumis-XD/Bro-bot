import axios from "axios";

export default {
	command: ".yts",
	name: "「 YOUTUBE SEARCH 」",
	description: "Cari video YouTube berdasarkan query.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Validasi input
			const queryMatch = text.match(/^.yts\s+(.+)/);
			const query = queryMatch ? queryMatch[1] : null;
			if (!query) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan query pencarian!\n\nContoh: *.yts For Revenge Serana*",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: `⏳ Mencari video *${query}* di YouTube...`,
			});

			// Ambil data dari API
			const { data } = await axios.get(
				`https://linecloud.my.id/api/search/yt?q=${encodeURIComponent(
					query,
				)}`,
			);

			// Validasi response
			if (!data.status || !data.data || !data.data.data.length) {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ada hasil ditemukan! Coba gunakan kata kunci lain.",
				});
				return;
			}

			// Ambil hasil pencarian (maksimal 5 video)
			const results = data.data.data;

			// Buat cards
			const cards = results.map((video, index) => ({
				image: { url: video.thumbnail },
				title: `${index + 1}. ${video.title}`,
				caption: `📺 *${video.title}*\n👤 *${video.author}*\n⏱️ ${video.duration} | 👀 ${video.views} views\n\n📌 Pilih format download di bawah.`,
				footer: "YouTube Search",
				buttons: [
					{
						name: "quick_reply",
						buttonParamsJson: JSON.stringify({
							display_text: "🎥 Download MP4",
							id: `.ytmp4 ${video.url}`,
						}),
					},
					{
						name: "quick_reply",
						buttonParamsJson: JSON.stringify({
							display_text: "🎵 Download MP3",
							id: `.ytmp3 ${video.url}`,
						}),
					},
					{
						name: "cta_url",
						buttonParamsJson: JSON.stringify({
							display_text: "🔗 Tonton di YouTube",
							url: video.url,
						}),
					},
				],
			}));

			// Kirim hasil dalam format cards
			await sock.sendMessage(
				sender,
				{
					text: `📺 *Hasil Pencarian YouTube*\n🔍 *Query:* ${query}`,
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
