import axios from "axios";

export default {
	command: ".igs",
	name: "「 INSTAGRAM STALK 」",
	description: "Melihat informasi akun Instagram seseorang.",
	execute: async (sock, sender, text, msg) => {
		const args = text.split(" ");
		if (!args[1]) {
			return await sock.sendMessage(
				sender,
				{ text: "⚠️ Masukkan username Instagram!" },
				{ quoted: msg },
			);
		}

		const apiUrl = `https://api.siputzx.my.id/api/stalk/Instagram?user=${encodeURIComponent(
			args[1],
		)}`;

		try {
			const response = await axios.get(apiUrl);
			const json = response.data;

			if (!json.status || !json.data || !json.data.user) {
				return await sock.sendMessage(
					sender,
					{
						text: "❌ Gagal mendapatkan data! Cek username yang diberikan.",
					},
					{ quoted: msg },
				);
			}

			const user = json.data.user;

			let infoText =
				`🔍 *Instagram Profile Stalk*\n\n` +
				`👤 *Username:* ${user.username}\n` +
				`📛 *Nama Lengkap:* ${user.full_name}\n` +
				`📄 *Bio:* ${user.biography || "Tidak ada"}\n` +
				`📌 *Kategori:* ${user.category || "Tidak ada"}\n` +
				`🔒 *Private:* ${user.is_private ? "✅" : "❌"}\n` +
				`✔️ *Verified:* ${user.is_verified ? "✅" : "❌"}\n` +
				`📊 *Followers:* ${user.follower_count}\n` +
				`📈 *Following:* ${user.following_count}\n` +
				`📸 *Postingan:* ${user.media_count}\n` +
				`🌍 *Website:* ${user.external_url || "Tidak ada"}`;

			// Kirim pesan dengan teks dan gambar profil
			await sock.sendMessage(
				sender,
				{
					image: { url: user.hd_profile_pic.url },
					caption: infoText,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error fetching Instagram API:", error);
			await sock.sendMessage(
				sender,
				{ text: "❌ Terjadi kesalahan saat mengambil data!" },
				{ quoted: msg },
			);
		}
	},
};
