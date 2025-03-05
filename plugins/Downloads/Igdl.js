import axios from "axios";

export default {
	command: ".igdl",
	name: "「 INSTAGRAM DOWNLOADS 」",
	description:
		"Download video atau gambar dari Instagram dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari perintah
			const urlMatch = text.match(/^\.igdl\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url || !url.startsWith("http")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan link Instagram yang valid!",
				});
				return;
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil media...",
			});

			// Ambil data dari API SiputzX
			const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(
				url,
			)}`;
			const response = await axios.get(apiUrl);

			// Validasi respons API
			if (!response.data?.status || !response.data?.data) {
				await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengambil media! Coba link lain.",
				});
				return;
			}

			// Ambil daftar media dari respons API
			const mediaList = response.data.data;

			// Cek jika tidak ada media yang ditemukan
			if (!Array.isArray(mediaList) || mediaList.length === 0) {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ditemukan media yang dapat diunduh!",
				});
				return;
			}

			// Kirim setiap media (gambar/video) satu per satu
			for (const media of mediaList) {
				const { url: mediaUrl, thumbnail } = media;

				// Tentukan tipe media berdasarkan respons API
				const mediaMessage = mediaUrl.includes("mp4")
					? { video: { url: mediaUrl }, mimetype: "video/mp4" }
					: { image: { url: mediaUrl } };

				await sock.sendMessage(
					sender,
					{
						...mediaMessage,
						caption: "✅ *Instagram Download Success!*",
						contextInfo: {
							externalAdReply: {
								title: "Instagram Downloader",
								body: "Success By Bro-Bot",
								thumbnailUrl: thumbnail || mediaUrl,
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
