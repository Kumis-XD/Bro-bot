import axios from "axios";

export default {
	command: ".npm",
	name: "「 NPMJS STALK 」",
	description: "Melacak informasi package NPM",
	execute: async (sock, sender, text, msg) => {
		try {
			const stalkMatch = text.match(/^\.npm\s+(\S+)/);
			const packageName = stalkMatch ? stalkMatch[1] : null;

			if (!packageName) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan nama package setelah perintah .npm",
				});
			}

			// Mengirim permintaan ke API NPM Stalker
			const { data } = await axios.get(
				`https://api.siputzx.my.id/api/stalk/npm?packageName=${encodeURIComponent(
					packageName,
				)}`,
			);

			// Jika respons sukses
			if (data.status && data.data) {
				const {
					name,
					versionLatest,
					versionPublish,
					versionUpdate,
					latestDependencies,
					publishDependencies,
					publishTime,
					latestPublishTime,
				} = data.data;

				// Format pesan respons
				const responseMessage =
					`📦 *Informasi Package NPM*\n\n` +
					`🔹 *Nama:* ${name}\n` +
					`🔹 *Versi Terbaru:* ${versionLatest}\n` +
					`🔹 *Versi Publish:* ${versionPublish}\n` +
					`🔹 *Jumlah Update:* ${versionUpdate}\n` +
					`🔹 *Dependensi Terbaru:* ${latestDependencies}\n` +
					`🔹 *Dependensi Publish:* ${publishDependencies}\n` +
					`📅 *Waktu Publish:* ${new Date(
						publishTime,
					).toLocaleString()}\n` +
					`📅 *Waktu Rilis Terbaru:* ${new Date(
						latestPublishTime,
					).toLocaleString()}`;

				sock.sendMessage(
					sender,
					{ text: responseMessage },
					{ quoted: msg },
				);
			} else {
				sock.sendMessage(sender, {
					text: "⚠️ Package tidak ditemukan atau terjadi kesalahan.",
				});
			}
		} catch (error) {
			console.error("Error fetching NPM package info:", error);
			sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat menghubungi API.",
			});
		}
	},
};
