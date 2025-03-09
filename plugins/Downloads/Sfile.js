export default {
	command: ".sfiledl",
	name: "「 SFILE DOWNLOAD 」",
	description: "Sfile downloader.",
	execute: async (sock, sender, text, msg) => {
		const urlMatch = text.match(/^\.sfile\s+(\S+)/);
		const url = urlMatch ? urlMatch[1] : null;

		if (!url) {
			return await sock.sendMessage(sender, {
				text: `Silahkan masukkan URL Sfile`,
			});
		}

		if (!url.match(/sfile\.mobi/i)) {
			return await sock.sendMessage(sender, {
				text: "URL tidak valid! Pastikan URL dari sfile.mobi",
			});
		}

		await sock.sendMessage(sender, { text: "Please Wait..." });

		try {
			const res = await sfile.download(url);
			if (res.status !== "success") throw res.message;

			const { filename, filesize, mimeType, result } = res.data;

			await conn.sendMessage(
				sender,
				{
					document: result.buffer,
					mimetype: "application/zip",
					fileName: filename.replace(/\.[^/.]+$/, "") + ".zip",
					caption: `Nama: ${filename}\nUkuran: ${filesize}`,
				},
				{ quoted: msg },
			);
		} catch (err) {
			await conn.sendMessage(sender, {
				text: `Terjadi kesalahan: ${err}`,
			});
		}
	},
};
