import axios from "axios";

export default {
	command: ".ttdl",
	name: "「 TikTok Downloader 」",
	description: "Download video/audio dari TikTok",
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

			const apiUrl = `https://api.siputzx.my.id/api/tiktok?url=${encodeURIComponent(
				url,
			)}`;

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil video...",
			});

			// Ambil data dari API menggunakan Axios
			const { data } = await axios.get(apiUrl);

			// Cek apakah API berhasil mengambil data
			if (!data.status || !data.data || !data.data.urls) {
				throw new Error("Gagal mendapatkan data dari API.");
			}

			// Ambil daftar URL video
			const videoUrls = data.data.urls;

			if (!videoUrls || videoUrls.length === 0) {
				await sock.sendMessage(sender, {
					text: "❌ Tidak ada video yang dapat diunduh!",
				});
				return;
			}

			// Coba kirim video dari salah satu URL
			let sent = false;
			for (const videoUrl of videoUrls) {
				try {
					await sock.sendMessage(
						sender,
						{
							video: { url: videoUrl },
							mimetype: "video/mp4",
							caption: "✅ Berhasil mengunduh video TikTok!",
						},
						{ quoted: msg },
					);
					sent = true;
					break; // Berhenti jika berhasil mengirim
				} catch (error) {
					console.warn(
						`⚠️ Gagal mengirim video dari URL: ${videoUrl}`,
					);
				}
			}

			if (!sent) {
				await sock.sendMessage(sender, {
					text: "❌ Gagal mengunduh video dari semua sumber!",
				});
			}
		} catch (error) {
			console.error("❌ Error di Ttdl.js:", error);
			sock.sendMessage(sender, {
				text: "❌ Gagal mengunduh video. Coba lagi!",
			});
		}
	},
};
