import axios from "axios";

export default {
	command: ".ytmp3",
	name: "「 YOUTUBE MP3 」",
	description: "Download audio YouTube dan mengirimkannya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil URL dari args menggunakan regex
			const urlMatch = text.match(/^.ytmp3\s+(\S+)/);
			const url = urlMatch ? urlMatch[1] : null;

			// Validasi URL
			if (!url || !url.startsWith("http")) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan link YouTube yang valid!",
				});
			}

			await sock.sendMessage(sender, {
				text: "⏳ Tunggu sebentar, sedang mengambil audio...",
			});

			// Ambil data audio dari API eksternal
			const { data: response } = await axios.get(
				`https://rest.cloudkuimages.xyz/api/download/ytmp3?url=${encodeURIComponent(
					url,
				)}`,
			);

			// Validasi respons API
			if (!response?.status || !response?.metadata?.download_url) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Gagal mengunduh audio! Coba link lain.",
				});
			}

			// Ambil detail audio dari response API
			const audioData = response.metadata;
			const title = audioData.title || "YouTube Audio";
			const author = audioData.author || "Tidak diketahui";
			const bitrate = audioData.bitrate || "Unknown";
			const audioUrl = audioData.download_url;
			const thumbnailUrl =
				"https://i.ibb.co/32kGwr0/8b11a86980c64720a41ec22332a83115.jpg"; // Gambar default

			// Kirim audio ke pengguna
			await sock.sendMessage(
				sender,
				{
					audio: { url: audioUrl },
					mimetype: "audio/mpeg",
					fileName: `${title}.mp3`,
					caption: `🎵 *YouTube MP3 Download*\n\n📌 *Judul:* ${title}\n🎤 *Author:* ${author}\n🔊 *Bitrate:* ${bitrate} kbps\n🔗 *Link:* ${url}`,
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							title: title,
							body: `🎤 ${author} • 🔊 ${bitrate} kbps`,
							thumbnailUrl: thumbnailUrl,
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
