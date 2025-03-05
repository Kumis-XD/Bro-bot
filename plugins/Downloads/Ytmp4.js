import axios from "axios";

export default {
	command: ".ytmp4",
	name: "「 YOUTUBE MP4 」",
	description: "Mendapatkan video YouTube dan mengunduhnya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args
			const urlMatch = text.match(/^.ytmp4\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url || !url.startsWith("http")) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil video...",
			});

			// Ambil data video dari API eksternal
			const { data: response } = await axios.get(
				`https://linecloud.my.id/api/download/ytmp4?url=${url}`,
			);

			// Validasi respons dari API
			if (!response?.status || !response?.data?.downloadLink) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mendapatkan video! Coba link lain.",
				});
			}

			// Ambil detail video dari response API
			const videoData = response.data;
			const title = videoData.title || "Video";
			const creator = videoData.channelTitle || "Tidak diketahui";
			const duration = videoData.duration || "Tidak diketahui";
			const views = videoData.statistics?.viewCount || "Tidak diketahui";
			const uploaded = videoData.publishedAt || "Tidak diketahui";
			const thumbnail =
				videoData.thumbnails?.high?.url ||
				videoData.thumbnails?.default?.url;

			// Kirim informasi video ke pengguna
			const caption =
				`🎬 *Informasi Video YouTube*\n\n` +
				`📌 *Judul:* ${title}\n` +
				`👤 *Creator:* ${creator}\n` +
				`⏳ *Durasi:* ${duration} detik\n` +
				`👀 *Views:* ${views}\n` +
				`🕒 *Diunggah:* ${uploaded}\n`;

			await sock.sendMessage(
				sender,
				{
					video: { url: videoData.downloadLink },
					mimetype: "video/mp4",
					caption: caption,
					fileName: `${title}.mp4`,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							title: title,
							body: creator,
							...(thumbnail ? { thumbnailUrl: thumbnail } : {}),
							renderLargerThumbnail: true,
							mediaType: 1,
							mediaUrl: url,
							sourceUrl: url,
						},
					},
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
