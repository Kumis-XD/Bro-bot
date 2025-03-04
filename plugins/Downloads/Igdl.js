import axios from "axios";

export default {
	command: ".igdl",
	name: "「 INSTAGRAM DOWNLOADS 」",
	description: "Download video Instagram dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Gunakan regex untuk mengambil URL setelah perintah
			const urlMatch = text.match(/^\.igdl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Cek apakah URL valid
			if (!url || !url.startsWith("http")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan link Instagram yang valid!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil video...",
			});

			// Ambil data dari API SiputzX
			const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(
				url,
			)}`;
			const response = await axios.get(apiUrl);

			// Jika request gagal atau tidak ada data
			if (!response.data.status || !response.data.data) {
				await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengambil media! Coba link lain.",
				});
				return;
			}

			// Ambil data dari respons API
			const mediaList = response.data.data;

			// Jika tidak ada media yang dapat diunduh
			if (!mediaList || mediaList.length === 0) {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ditemukan media yang dapat diunduh!",
				});
				return;
			}

			// Kirim setiap video satu per satu
			for (const media of mediaList) {
				await sock.sendMessage(
					sender,
					{
						video: { url: media.url },
						mimetype: "video/mp4",
						caption: `🎥 *Instagram Video*`,
						contextInfo: {
							externalAdReply: {
								title: "Instagram Video Downloader",
								body: "Success By Bro-Bot",
								thumbnailUrl: media.thumbnail,
								sourceUrl: url,
								mediaType: 1,
								renderLargerThumbnail: true,
							},
						},
					},
					{ quoted: msg },
				);
			}
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
