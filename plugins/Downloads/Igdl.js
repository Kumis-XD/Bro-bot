import axios from "axios";

export default {
	command: ".igdl",
	name: "「 INSTAGRAM DOWNLOADS 」",
	description:
		"Download video atau gambar dari Instagram dan mengirimkannya.",
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
				text: "⏳ Tunggu sebentar, sedang mengambil media...",
			});

			// Ambil data dari API SuraWeb
			const apiUrl = `https://api.suraweb.online/download/instagram?url=${encodeURIComponent(
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
			const { title, thumbnail, downloadUrls } = response.data.data;

			// Jika tidak ada media yang dapat diunduh
			if (!downloadUrls || downloadUrls.length === 0) {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ditemukan media yang dapat diunduh!",
				});
				return;
			}

			// Kirim setiap media (video/gambar) satu per satu
			for (const mediaUrl of downloadUrls) {
				await sock.sendMessage(
					sender,
					{
						video: { url: mediaUrl },
						mimetype: "video/mp4",
						caption: `🎥 *${title}*`,
						contextInfo: {
							externalAdReply: {
								title: "Instagram Video Downloader",
								body: "Success By Bro-Bot",
								thumbnailUrl: thumbnail,
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
