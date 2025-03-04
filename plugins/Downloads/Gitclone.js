import fetch from "node-fetch";

const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

export default {
	command: ".clone",
	name: "「 CLONE GITHUB 」",
	description: "Cloning repository dari github.",
	execute: async (sock, sender, text, msg) => {
		const args = text.split(" "); // Menggunakan text sebagai input perintah

		if (!args[1])
			return await sock.sendMessage(sender, {
				text: `*Contoh Penggunaan:*\n.clone https://github.com/username/repo`,
			});
		if (!regex.test(args[1]))
			return await sock.sendMessage(sender, {
				text: "❌ *URL GitHub tidak valid!*",
			});

		let [_, user, repo] = args[1].match(regex) || [];
		repo = repo.replace(/.git$/, "");

		let apiUrl = `https://api.github.com/repos/${user}/${repo}`;
		let zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

		try {
			let repoRes = await fetch(apiUrl);
			if (!repoRes.ok)
				throw `❌ *Repository tidak ditemukan atau API limit GitHub tercapai!*`;
			let repoInfo = await repoRes.json();

			if (repoInfo.private) throw "🔒 *Repository bersifat private!*";

			let zipRes = await fetch(zipUrl, { method: "HEAD" });
			if (!zipRes.ok) throw "❌ *Gagal mendapatkan file ZIP!*";

			let size = zipRes.headers.get("content-length");
			if (size && size > 50 * 1024 * 1024)
				throw "⚠️ *Ukuran repository terlalu besar!* (Maks 50MB)";

			let filename =
				zipRes.headers
					.get("content-disposition")
					?.match(/attachment; filename=(.*)/)?.[1] || `${repo}.zip`;
			let lastUpdated = new Date(repoInfo.updated_at).toLocaleString(
				"id-ID",
				{
					weekday: "long",
					day: "numeric",
					month: "long",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				},
			);

			let repoText = `
🌐 Repository Info
👤 *Nama:* ${repoInfo.full_name}
📑 *Deskripsi:* ${repoInfo.description || "Tidak ada"}
⭐ *Stars:* ${repoInfo.stargazers_count}
⛓️‍💥 *Forks:* ${repoInfo.forks_count}
📍 *Issues:* ${repoInfo.open_issues_count}
🗓️ *Terakhir Diperbarui:* ${lastUpdated}`.trim();

			// Kirim info repositori ke grup
			await sock.relayMessage(
				sender,
				{
					extendedTextMessage: {
						text: repoText,
						mentionedJid: [sender],
						contextInfo: {
							externalAdReply: {
								title: repoInfo.full_name,
								body: `⭐ ${repoInfo.stargazers_count} | 🍴 ${repoInfo.forks_count} | 🐞 ${repoInfo.open_issues_count}`,
								thumbnailUrl: repoInfo.owner.avatar_url,
								mediaType: 1,
								renderLargerThumbnail: true,
								sourceUrl: `https://github.com/${user}/${repo}`,
								showAdAttribution: true,
							},
						},
					},
				},
				{ quoted: msg },
			);

			// Kirim file ZIP ke pengguna
			await sock.sendMessage(
				sender,
				{
					document: { url: zipUrl },
					mimetype: "application/zip",
					fileName: filename,
				},
				{ quoted: msg },
			);
		} catch (e) {
			console.error(e);
			await sock.sendMessage(sender, { text: e });
		}
	},
};
