import axios from "axios";

export default {
	command: ".spotify",
	name: "「 SPOTIFY SEARCH 」",
	description: "Cari lagu di Spotify dan tampilkan hasilnya.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil query dari args
			const queryMatch = text.match(/^.spotify\s+(.+)/);
			const query = queryMatch ? queryMatch[1] : null;

			// Validasi query
			if (!query) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon sertakan judul lagu yang ingin dicari!",
				});
			}

			await sock.sendMessage(sender, {
				text: `⏳ Sedang mencari lagu di *${query}* Spotify..."`
			});

			// Ambil data lagu dari API eksternal
			const { data: results } = await axios.get(
				`https://linecloud.my.id/api/search/spotify?q=${encodeURIComponent(
					query,
				)}`,
			);

			// Validasi respons API
			if (!Array.isArray(results) || results.length === 0) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Tidak ditemukan lagu yang sesuai! Coba kata kunci lain.",
				});
			}

			// Buat daftar lagu sebagai sections
			const sections = [
				{
					title: `Hasil Pencarian untuk: ${query}`,
					rows: results.map((song, index) => ({
						header: `${index + 1}. ${song.name}`,
						title: song.name,
						description: `🎤 ${song.artists}\n⏱️ ${Math.floor(
							song.duration_ms / 60000,
						)}:${String(
							Math.floor((song.duration_ms % 60000) / 1000),
						).padStart(2, "0")}`,
						id: `.spotydl ${song.link}`,
					})),
				},
			];

			let ppUrl;
			try {
				ppUrl = await sock.profilePictureUrl(sender, "image");
			} catch (err) {
				ppUrl = "https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg";
			}

			// Kirim pesan dengan daftar lagu dalam format interactiveMeta
			await sock.sendMessage(
				sender,
				{
					image: {
						url: "https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg",
					},
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl: "https://cloudkuimages.xyz/uploads/images/67c45f2fd0cc3.jpg",
							title: "「 Padz x Bro Bot 」",
							body: new Date().toLocaleString("id-ID"),
							sourceUrl: "",
							thumbnailUrl: ppUrl,
							renderLargerThumbnail: true,
						},
					},
					caption: `🎶 *Spotify Search Results* 🎶

🔍 *Pencarian:* ${query}
📌 *Ditemukan:* ${results.length} lagu`,
					footer: "© Bro Bot",
					buttons: [
						{
							buttonId: "spotify_results",
							buttonText: {
								displayText: "📜 Lihat Semua Lagu",
							},
							type: 4,
							nativeFlowInfo: {
								name: "single_select",
								paramsJson: JSON.stringify({
									title: "Pilih Lagu",
									sections: sections,
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
