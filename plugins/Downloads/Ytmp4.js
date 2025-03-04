import { getVideoInfo } from "hybrid-ytdl";
import axios from "axios";

export default {
	command: ".ytmp4",
	name: "「 YOUTUBE MP4 」",
	description: "Mendapatkan informasi video YouTube dan mengunduhnya.",
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
				text: "⏳ Tunggu sebentar, sedang mengambil informasi video...",
			});

			// Ambil informasi video
			const videoInfo = await getVideoInfo(url);

			// Ambil data video dari API eksternal
			const { data: videoData } = await axios.get(
				`https://linecloud.my.id/api/download/ytmp4?url=${url}`,
			);

			// Jika gagal mendapatkan informasi video
			if (!videoData?.status) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mendapatkan informasi video! Coba link lain.",
				});
			}

			// Jika gagal mendapatkan video
			if (!videoData?.data?.downloadLink) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengunduh video! Coba link lain.",
				});
			}

			console.log(videoData?.data?.downloadLink);

			// Pastikan semua data tersedia
			const title = videoInfo.title || videoData?.data?.title || "Video";
			const creator =
				videoInfo.creator ||
				videoData?.data?.channelTitle ||
				"Tidak diketahui";
			const duration = videoInfo.duration
				? `${videoInfo.duration} detik`
				: "Tidak diketahui";
			const views = videoInfo.views
				? videoInfo.views.toLocaleString()
				: videoData?.data?.statistics?.viewCount || "Tidak diketahui";
			const uploaded =
				videoInfo.uploaded ||
				videoData?.data?.publishedAt ||
				"Tidak diketahui";
			const thumbnail = videoData?.data?.thumbnails?.high?.url || null;

			// Kirim informasi video ke pengguna
			const caption =
				`🎬 *Informasi Video YouTube*\n\n` +
				`📌 *Judul:* ${title}\n` +
				`👤 *Creator:* ${creator}\n` +
				`⏳ *Durasi:* ${duration}\n` +
				`👀 *Views:* ${views}\n` +
				`🕒 *Diunggah:* ${uploaded}\n`;

			await sock.sendMessage(
				sender,
				{
					video: { url: videoData?.data?.downloadLink },
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
