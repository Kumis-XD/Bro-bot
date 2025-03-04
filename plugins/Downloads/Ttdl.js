import axios from "axios";

export default {
	command: ".ttdl",
	name: "「 TikTok Downloader 」",
	description: "Download video dari TikTok tanpa watermark.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Gunakan regex untuk mengambil URL setelah perintah
			const urlMatch = text.match(/^\.ttdl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Cek apakah URL valid
			if (!url || !url.startsWith("http")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan link TikTok yang valid!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil video...",
			});

			// Ambil data dari API SuraWeb
			const apiUrl = `https://api.suraweb.online/download/tiktok?url=${encodeURIComponent(
				url,
			)}`;
			const { data } = await axios.get(apiUrl);

			// Jika request gagal atau tidak ada data
			if (
				!data.status ||
				!data.data ||
				!data.data.media ||
				!data.data.media.video
			) {
				await sock.sendMessage(sender, {
					text: "❌ Gagal mengambil video! Coba link lain.",
				});
				return;
			}

			// Ambil data dari respons API
			const { nickname, profilePic } = data.data.author;
			const videoUrl = data.data.media.video.nowm;

			// Kirim video ke pengguna
			await sock.sendMessage(
				sender,
				{
					video: { url: videoUrl },
					mimetype: "video/mp4",
					caption: `🎵 *Video TikTok*\n👤 *Pembuat:* ${nickname}`,
					contextInfo: {
						externalAdReply: {
							title: `Video dari ${nickname}`,
							body: "Success By Bro-Bot",
							thumbnailUrl: profilePic,
							sourceUrl: url,
							mediaType: 1,
							renderLargerThumbnail: true,
						},
					},
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error di ttdl.js:", error);
			await sock.sendMessage(sender, {
				text: "❌ Gagal mengunduh video. Coba lagi!",
			});
		}
	},
};
