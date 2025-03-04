import axios from "axios";
import * as cheerio from "cheerio";

const sfile = (url) => {
	return new Promise(async (resolve, reject) => {
		try {
			const headers = {
				referer: url,
				"user-Agent":
					"Mozilla/5.0 (Linux; Android 14; NX769J Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36",
			};

			let getPage = await axios.get(url, { headers });
			let $ = cheerio.load(getPage.data);
			let safelink = $("#safe_link").attr("href");

			headers.cookie = getPage.headers["set-cookie"]
				.map((c) => c.split(";")[0])
				.join("; ");
			headers.referer = safelink;

			let resPage = await axios.get(safelink, { headers });
			let s,
				f = cheerio.load(resPage.data);

			const [dl, [name, ext, size], downloaded, uploaded, mime, author] =
				[
					f("#download").attr("href") +
						"&k=" +
						f("#download")
							.attr("onclick")
							.match(/&k='\+(.*?)';/)?.[1]
							.replace("'", ""),
					(() => {
						s = f(".w3-text-blue b")
							.text()
							.match(
								/^(.+?)(?:\.([^.\s()]+))?(?:\s*\(([^)]*)\))?$/,
							);
						return [s[1].trim(), s[2], s[3]];
					})(),
					$(".icon-cloud-download")
						.parent()
						.text()
						.split(":")[1]
						.trim(),
					$(".icon-upload").parent().text().split(":")[1].trim(),
					$(".list:nth-child(2)").eq(0).text().slice(3).trim(),
					$(".list a").first().text().trim(),
				];

			resolve({
				name,
				size,
				author,
				uploaded,
				downloaded,
				mime,
				ext,
				dl,
			});
		} catch (e) {
			reject(e);
		}
	});
};

export default {
	command: ".sfile",
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
			const result = await sfile(url);

			let fileDetails = `*SFILE DOWNLOADER*\n\n`;
			fileDetails += `*File Name :* ${result.name}${
				result.ext ? `.${result.ext}` : ""
			}\n`;
			fileDetails += `*Size :* ${result.size || "Tidak diketahui"}\n`;
			fileDetails += `*Author :* ${result.author || "Tidak diketahui"}\n`;
			fileDetails += `*Upload Date:* ${
				result.uploaded || "Tidak diketahui"
			}\n`;
			fileDetails += `*Total Download :* ${result.downloaded || "0"}\n`;
			fileDetails += `*Type :* ${result.mime || "Tidak diketahui"}`;

			if (!result.dl) {
				return await sock.sendMessage(sender, {
					text: `${fileDetails}\n\n❌ Link download tidak tersedia.`,
				});
			}

			try {
				const response = await axios.get(result.dl, {
					responseType: "arraybuffer",
					headers: {
						referer: url,
						"user-Agent":
							"Mozilla/5.0 (Linux; Android 14; NX769J Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36",
					},
				});

				const fileName = `${result.name}${
					result.ext ? `.${result.ext}` : ""
				}`;

				await conn.sendMessage(
					sender,
					{
						document: response.data,
						fileName: fileName,
						mimetype: result.mime || "application/octet-stream",
						caption: fileDetails,
					},
					{ quoted: msg },
				);
			} catch (downloadError) {
				await sock.sendMessage(sender, {
					text: `${fileDetails}\n\n🔗 *Link Download:* ${result.dl}`,
				});
			}
		} catch (e) {
			await sock.sendMessage(sender, {
				text: `Terjadi kesalahan: ${e.message}`,
			});
		}
	},
};
