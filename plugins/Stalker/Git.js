import axios from "axios";

export default {
	command: ".git",
	name: "「 GITHUB STALK 」",
	description: "Melacak informasi akun GitHub",
	execute: async (sock, sender, text, msg) => {
		try {
			const gitMatch = text.match(/^\.git\s+(\S+)/);
			const username = gitMatch ? gitMatch[1] : null;

			if (!username) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan username GitHub setelah perintah .git",
				});
			}

			const { data } = await axios.get(
				`https://api.siputzx.my.id/api/stalk/github?user=${username}`,
			);

			if (data.status && data.data) {
				const user = data.data;
				const responseText =
					`🕵️ *GitHub Stalker*\n\n` +
					`👤 *Username:* ${user.username}\n` +
					`🏷️ *Nickname:* ${user.nickname || "Tidak ada"}\n` +
					`📄 *Bio:* ${user.bio || "Tidak ada"}\n` +
					`🔗 *Profile:* ${user.url}\n` +
					`📦 *Public Repos:* ${user.public_repo}\n` +
					`📝 *Public Gists:* ${user.public_gists}\n` +
					`👥 *Followers:* ${user.followers}\n` +
					`👤 *Following:* ${user.following}\n` +
					`📅 *Dibuat:* ${user.created_at}\n` +
					`🔄 *Terakhir Diperbarui:* ${user.updated_at}`;

				const profileImage = { url: user.profile_pic };

				await sock.sendMessage(sender, {
					text: responseText,
					image: profileImage,
				});
			} else {
				sock.sendMessage(sender, {
					text: "⚠️ Pengguna GitHub tidak ditemukan atau terjadi kesalahan.",
				});
			}
		} catch (error) {
			console.error("Error fetching GitHub user data:", error);
			sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat mengambil data dari GitHub.",
			});
		}
	},
};
