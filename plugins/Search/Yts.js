import axios from "axios";

export default {
	command: ".yts",
	name: "「 TOUTUBE SEARCH 」",
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

			// Ambil semua hasil pencarian
			const results = data.data.data;

			// Buat sections dengan dua opsi (MP4 & MP3)
			const sections = results.map((video, index) => ({
				title: `${index + 1}. ${video.title}`,
				rows: [
					{
						header: "🎥 Download MP4",
						title: "Download Video",
						description: `📺 ${video.author} | ⏱️ ${video.duration} | 👀 ${video.views} views`,
						id: `.ytmp4 ${video.url}`,
					},
					{
						header: "🎵 Download MP3",
						title: "Download Audio",
						description: `🎤 ${video.author} | ⏱️ ${video.duration}`,
						id: `.ytmp3 ${video.url}`,
					},
				],
			}));

			// Kirim pesan interaktif dengan daftar video + opsi download MP4/MP3
			await sock.sendMessage(
				sender,
				{
					image: { url: results[0].thumbnail },
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl: results[0].url,
							title: "「 Padz x Bro Bot 」",
							body: "Hasil pencarian YouTube",
							sourceUrl: results[0].url,
							thumbnailUrl: "https://files.fotoenhancer.com/uploads/4f3f4c83-2e52-4296-8063-12756c823d05.jpg",
							renderLargerThumbnail: true,
						},
					},
					caption: `📺 *Hasil Pencarian YouTube*\n🔍 *Query:* ${query}\n\n📌 Pilih video dan format download di bawah.`,
					footer: "© Bro Bot",
					buttons: [
						{
							buttonId: "action",
							buttonText: {
								displayText: "Pilih Video 🎥🎵",
							},
							type: 4,
							nativeFlowInfo: {
								name: "single_select",
								paramsJson: JSON.stringify({
									title: "Pilih Video & Format",
									sections,
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
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
