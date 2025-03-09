import dotenv from "dotenv";
import axios from "axios";
import moment from "moment";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";
import ora from "ora";
import fakeUa from "fake-useragent";
import * as cheerio from "cheerio";
import FormData from "form-data";

const prayerTimesCache = new Map(); // Cache untuk menyimpan waktu sholat per hari

dotenv.config();

// Data umum
const thumb = process.env.THUMBNAIL_URL;
const botname = process.env.BOT_NAME;
const ownername = process.env.OWNER_NAME;
const desc = process.env.BOT_DESCRIPTION;

export const sfiledl = {
	download: async function (url) {
		const headers = {
			referer: url,
			accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
			"accept-language": "en-US,en;q=0.9",
			"user-Agent": "Postify/1.0.0",
		};

		try {
			const response = await axios.get(url, { headers });
			headers.Cookie = response.headers["set-cookie"]
				.map((cookie) => cookie.split(";")[0])
				.join("; ");

			const [filename, mimetype, downloadLink] = [
				response.data.match(/<h1 class="intro">(.*?)<\/h1>/s)?.[1] ||
					"",
				response.data.match(
					/<div class="list">.*? - (.*?)<\/div>/,
				)?.[1] || "",
				response.data.match(
					/<a class="w3-button w3-blue w3-round" id="download" href="([^"]+)"/,
				)?.[1],
			];

			if (!downloadLink)
				return {
					creator: "Daffa ~",
					status: "error",
					code: 500,
					data: [],
					message: "Download link tidak ditemukan!",
				};

			headers.Referer = downloadLink;
			const final = await axios.get(downloadLink, { headers });

			const [directLink, key, filesize] = [
				final.data.match(
					/<a class="w3-button w3-blue w3-round" id="download" href="([^"]+)"/,
				)?.[1],
				final.data.match(/&k='\+(.*?)';/)?.[1].replace(`'`, ""),
				final.data.match(/Download File \((.*?)\)/)?.[1],
			];

			const result = directLink + (key ? `&k=${key}` : "");
			if (!result)
				return {
					creator: "Daffa ~",
					status: "error",
					code: 500,
					data: [],
					message: "Direct Link Download tidak ditemukan!",
				};

			const data = await this.convert(result, url);

			return {
				creator: "Daffa ~",
				status: "success",
				code: 200,
				data: { filename, filesize, mimetype, result: data },
			};
		} catch (error) {
			return {
				creator: "Daffa ~",
				status: "error",
				code: 500,
				data: [],
				message: error.message,
			};
		}
	},

	convert: async function (url, directLink) {
		try {
			const init = await axios.get(url, {
				maxRedirects: 0,
				validateStatus: (status) => status >= 200 && status < 303,
				headers: {
					Referer: directLink,
					"User-Agent": "Postify/1.0.0",
				},
			});

			const cookies = init.headers["set-cookie"]
				.map((c) => c.split(";")[0])
				.join("; ");
			const redirect = init.headers.location;

			const final_result = await axios.get(redirect, {
				responseType: "arraybuffer",
				headers: {
					referer: directLink,
					"user-agent": "Postify/1.0.0",
					cookie: cookies,
				},
			});

			const filename =
				final_result.headers["content-disposition"]?.match(
					/filename=["']?([^"';]+)["']?/,
				)?.[1] || "Tidak diketahui";
			return {
				filename,
				mimeType: "application/zip",
				buffer: Buffer.from(final_result.data),
			};
		} catch (error) {
			throw error;
		}
	},
};

export async function SFile(query) {
	const url = `https://sfile.mobi/search.php?q=${encodeURIComponent(query)}`;

	const headers = {
		Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		"User-Agent": fakeUa(),
	};

	try {
		const { data } = await axios.get(url, { headers });
		const $ = cheerio.load(data);

		let results = [];

		$(".list").each((_, element) => {
			const linkElement = $(element).find("a");
			const href = linkElement.attr("href");
			let judul = linkElement.text().trim();
			judul = judul.replace(/\.[a-zA-Z0-9]+$/, "").trim();
			const size = $(element).text().trim();
			const openBracket = size.lastIndexOf("(");
			const closeBracket = size.lastIndexOf(")");
			const fileSize =
				openBracket !== -1 && closeBracket !== -1
					? size.slice(openBracket + 1, closeBracket)
					: "Unknown";

			if (href && judul && fileSize !== "Unknown") {
				results.push({ href, judul, fileSize });
			}
		});

		if (results.length === 0) {
			return {
				status: "error",
				author: "padz",
				message: "Tidak ada hasil yang ditemukan!",
				result: [],
			};
		}

		return {
			status: "success",
			author: "padz",
			result: results,
		};
	} catch (error) {
		console.error("Error fetching data:", error.message);
		return {
			status: "error",
			author: "padz",
			message: error.message,
			result: [],
		};
	}
}

export const transcribe = async (url) => {
	try {
		let res = await axios
			.get(`https://yts.kooska.xyz/?url=${encodeURIComponent(url)}`)
			.then((i) => i.data);
		return {
			status: true,
			video_id: res.video_id,
			summarize: res.ai_response,
			transcript: res.transcript,
		};
	} catch (e) {
		return {
			status: false,
			msg: `Gagal mendapatkan respon, dengan pesan: ${e.message}`,
		};
	}
};

export const fpack = {
	key: {
		fromMe: false,
		participant: "0@s.whatsapp.net",
		remoteJid: "status@broadcast",
	},
	message: {
		pollCreationMessageV3: {
			name: botname,
			options: [{ optionName: "1" }, { optionName: "2" }],
			selectableOptionsCount: 0,
		},
	},
};

export const fvent = {
	key: {
		fromMe: false,
		participant: "0@s.whatsapp.net",
		remoteJid: "status@broadcast",
	},
	message: {
		eventMessage: {
			isCanceled: false,
			name: botname,
			description: desc,
			startTime: "1738760400",
		},
	},
};

async function getPrayerTimes(city) {
	const spinner = ora(`🔄 Mengambil jadwal sholat untuk ${city}...`).start();

	try {
		const response = await axios.get(
			`https://api.vreden.my.id/api/islami/jadwalsholat?city=${city}`,
		);

		if (
			response.data &&
			response.data.result &&
			response.data.result.timings
		) {
			spinner.succeed(`Berhasil mengambil jadwal sholat untuk ${city}`);
			return response.data.result.timings;
		} else {
			spinner.fail(`❌ Data waktu sholat untuk ${city} tidak ditemukan.`);
			return null;
		}
	} catch (error) {
		spinner.fail(`❌ Gagal mengambil waktu sholat: ${error.message}`);
		return null;
	}
}

export async function schedulePrayerReminders(sock, chatId, city) {
	const today = new Date().toISOString().split("T")[0];

	if (!prayerTimesCache.has(today)) {
		const timings = await getPrayerTimes(city);
		if (!timings) return;
		prayerTimesCache.set(today, timings);
	}

	const prayerTimes = prayerTimesCache.get(today);
	const prayerNames = [
		{
			name: "Imsak",
			time: prayerTimes["Imsak"],
			message:
				"⏰ Imsak telah tiba! Waktu sahur telah selesai. Bersiaplah untuk sholat Subuh. 🕌",
			audio: "https://files.catbox.moe/olsp7o.mp3", // File audio imsak
		},
		{
			name: "Fajr (Subuh)",
			time: prayerTimes["Fajr"],
			message: "⏰ Subuh telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://files.catbox.moe/m8lr70.mp3",
		},
		{
			name: "Dhuhr (Dzuhur)",
			time: prayerTimes["Dhuhr"],
			message: "⏰ Dzuhur telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://files.catbox.moe/8uon3o.mp3",
		},
		{
			name: "Asr (Ashar)",
			time: prayerTimes["Asr"],
			message: "⏰ Ashar telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://files.catbox.moe/8uon3o.mp3",
		},
		{
			name: "Maghrib",
			time: prayerTimes["Maghrib"],
			message: "⏰ Maghrib telah tiba! Waktunya berbuka puasa. 🌙",
			audio: "https://files.catbox.moe/8uon3o.mp3",
		},
		{
			name: "Isha (Isya)",
			time: prayerTimes["Isha"],
			message: "⏰ Isya telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://files.catbox.moe/8uon3o.mp3",
		},
	];

	// Jadwalkan pengingat sholat dengan audio
	prayerNames.forEach(({ name, time, message, audio }) => {
		if (!time) return;

		const now = new Date();
		const [hour, minute] = time.split(":").map(Number);
		const reminderTime = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			hour,
			minute,
			0,
		);

		// Jadwalkan pesan dan audio di waktu sholat
		schedule.scheduleJob(reminderTime, async () => {
			await sock.sendMessage(chatId, {
				audio: { url: audio },
				ptt: true,
				mimetype: "audio/mpeg",
				contextInfo: {
					externalAdReply: {
						showAdAttribution: true,
						title: message,
						body: time,
						thumbnailUrl: "https://files.catbox.moe/v2tdfk.jpg",
						renderLargerThumbnail: true,
						mediaType: 1,
						mediaUrl: "",
						sourceUrl: audio,
					},
				},
			});
		});
	});
}

export const fvn = {
	key: { participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
	message: {
		audioMessage: {
			mimetype: "audio/ogg; codecs=opus",
			seconds: 359996400,
			ptt: true,
		},
	},
};

const savetube = {
	api: {
		base: "https://media.savetube.me/api",
		cdn: "/random-cdn",
		info: "/v2/info",
		download: "/download",
	},
	headers: {
		accept: "*/*",
		"content-type": "application/json",
		origin: "https://yt.savetube.me",
		referer: "https://yt.savetube.me/",
		"user-agent": "Postify/1.0.0",
	},
	formats: ["144", "240", "360", "480", "720", "1080", "mp3"],

	crypto: {
		hexToBuffer: (hexString) => {
			const matches = hexString.match(/.{1,2}/g);
			return Buffer.from(matches.join(""), "hex");
		},

		decrypt: async (enc) => {
			try {
				const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
				const data = Buffer.from(enc, "base64");
				const iv = data.slice(0, 16);
				const content = data.slice(16);
				const key = savetube.crypto.hexToBuffer(secretKey);

				const decipher = crypto.createDecipheriv(
					"aes-128-cbc",
					key,
					iv,
				);
				let decrypted = decipher.update(content);
				decrypted = Buffer.concat([decrypted, decipher.final()]);

				return JSON.parse(decrypted.toString());
			} catch (error) {
				throw new Error(`${error.message}`);
			}
		},
	},

	isUrl: (str) => {
		try {
			new URL(str);
			return true;
		} catch (_) {
			return false;
		}
	},

	youtube: (url) => {
		if (!url) return null;
		const a = [
			/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
			/youtu\.be\/([a-zA-Z0-9_-]{11})/,
		];
		for (let b of a) {
			if (b.test(url)) return url.match(b)[1];
		}
		return null;
	},

	request: async (endpoint, data = {}, method = "post") => {
		try {
			const { data: response } = await axios({
				method,
				url: `${
					endpoint.startsWith("http") ? "" : savetube.api.base
				}${endpoint}`,
				data: method === "post" ? data : undefined,
				params: method === "get" ? data : undefined,
				headers: savetube.headers,
			});
			return {
				status: true,
				code: 200,
				data: response,
			};
		} catch (error) {
			return {
				status: false,
				code: error.response?.status || 500,
				error: error.message,
			};
		}
	},

	getCDN: async () => {
		const response = await savetube.request(savetube.api.cdn, {}, "get");
		if (!response.status) return response;
		return {
			status: true,
			code: 200,
			data: response.data.cdn,
		};
	},

	download: async (link, format) => {
		if (!link) {
			return {
				status: false,
				code: 400,
				error: "Linknya mana? Yakali download kagak ada linknya 🗿",
			};
		}

		if (!savetube.isUrl(link)) {
			return {
				status: false,
				code: 400,
				error: "Lu masukin link apaan sih 🗿 Link Youtube aja bree, kan lu mau download youtube 👍🏻",
			};
		}

		if (!format || !savetube.formats.includes(format)) {
			return {
				status: false,
				code: 400,
				error: "Formatnya kagak ada bree, pilih yang udah disediain aja yak, jangan nyari yang gak ada 🗿",
				available_fmt: savetube.formats,
			};
		}

		const id = savetube.youtube(link);
		if (!id) {
			return {
				status: false,
				code: 400,
				error: "Kagak bisa ekstrak link youtubenya nih, btw link youtubenya yang bener yak.. biar kagak kejadian begini lagi 😂",
			};
		}

		try {
			const cdnx = await savetube.getCDN();
			if (!cdnx.status) return cdnx;
			const cdn = cdnx.data;

			const result = await savetube.request(
				`https://${cdn}${savetube.api.info}`,
				{
					url: `https://www.youtube.com/watch?v=${id}`,
				},
			);
			if (!result.status) return result;
			const decrypted = await savetube.crypto.decrypt(result.data.data);

			const dl = await savetube.request(
				`https://${cdn}${savetube.api.download}`,
				{
					id: id,
					downloadType: format === "mp3" ? "audio" : "video",
					quality: format,
					key: decrypted.key,
				},
			);

			return {
				status: true,
				code: 200,
				result: {
					title: decrypted.title || "Gak tau 🤷🏻",
					type: format === "mp3" ? "audio" : "video",
					format: format,
					thumbnail:
						decrypted.thumbnail ||
						`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
					download: dl.data.data.downloadUrl,
					id: id,
					key: decrypted.key,
					duration: decrypted.duration,
					quality: format,
					downloaded: dl.data.data.downloaded || false,
				},
			};
		} catch (error) {
			return {
				status: false,
				code: 500,
				error: error.message,
			};
		}
	},
};

export { savetube };

export const fgif = {
	key: { participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
	message: {
		videoMessage: {
			title: botname,
			h: botname,
			seconds: "359996400",
			gifPlayback: true,
			caption: ownername,
			jpegThumbnail: thumb,
		},
	},
};

export const fgclink = {
	key: { participant: "0@s.whatsapp.net", remoteJid: "0@s.whatsapp.net" },
	message: {
		groupInviteMessage: {
			groupJid: "3@g.us",
			inviteCode: "m",
			groupName: botname,
			caption: "[!] ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴ",
			jpegThumbnail: thumb,
		},
	},
};

export const fvideo = {
	key: {
		fromMe: false,
		participant: "0@s.whatsapp.net",
		remoteJid: "status@broadcast",
	},
	message: {
		videoMessage: {
			title: botname,
			h: botname,
			seconds: "359996400",
			caption: ownername,
			jpegThumbnail: thumb,
		},
	},
};

export const floc = {
	key: { participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
	message: { locationMessage: { name: botname, jpegThumbnail: thumb } },
};

export const fkontak = {
	key: { participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
	message: {
		contactMessage: {
			displayName: ownername,
			vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${ownername},;;;\nFN:${ownername}\nitem1.TEL;waid=6287862115557:6287862115557\nitem1.X-ABLabel:Mobile\nEND:VCARD`,
			jpegThumbnail: thumb,
			thumbnail: thumb,
			sendEphemeral: true,
		},
	},
};

export const fsaluran = {
	key: { remoteJid: "0@s.whatsapp.net", participant: "0@s.whatsapp.net" },
	message: {
		newsletterAdminInviteMessage: {
			newsletterJid: "26@newsletter",
			newsletterName: botname,
			caption: ownername,
		},
	},
};

export async function ffStalk(id) {
	let formdata = new FormData();
	formdata.append("uid", id);
	let { data } = await axios.post(
		"https://tools.freefireinfo.in/profileinfo.php?success=1",
		formdata,
		{
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				origin: "https://tools.freefireinfo.in",
				referer:
					"https://tools.freefireinfo.in/profileinfo.php?success=1",
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
				cookie: "_ga=GA1.1.1069461514.1740728304; __gads=ID=fa4de8c6be61d818:T=1740728303:RT=1740728303:S=ALNI_MYhU5TQnoVCO8ZG1O95QdJQc1-u1Q; __gpi=UID=0000104decca5eb5:T=1740728303:RT=1740728303:S=ALNI_MaVhADwQqMyGY78ZADfPLLbbw8zfQ; __eoi=ID=f87957be98f6348b:T=1740728303:RT=1740728303:S=AA-Afjb5ISbOLmlxgjjGBUWT3RO3; PHPSESSID=d9vet6ol1uj3frjs359to1i56v; _ga_JLWHS31Q03=GS1.1.1740728303.1.1.1740728474.0.0.0; _ga_71MLQQ24RE=GS1.1.1740728303.1.1.1740728474.57.0.1524185982; FCNEC=%5B%5B%22AKsRol9jtdxZ87hML5ighFLFnz7cP30Fki_Fu8JOnfi-SOz3P6QL33-sNGahy6Hq5X9moA6OdNMIcgFtvZZJnrPzHecI_XbfIDiQo9Nq-I1Y_PRXKDUufD0nNWLvDRQBJcdvu_bOqn2X06Njaz3k4Ml-NvsRVw21ew%3D%3D%22%5D%5D",
			},
		},
	);
	const $ = cheerio.load(data);
	let tr = $("div.result").html().split("<br>");
	let name = tr[0].split("Name: ")[1];
	let bio = tr[14].split(": ")[1];
	let like = tr[2].split(": ")[1];
	let level = tr[3].split(": ")[1];
	let exp = tr[4].split(": ")[1];
	let region = tr[5].split(": ")[1];
	let honorScore = tr[6].split(": ")[1];
	let brRank = tr[7].split(": ")[1];
	let brRankPoint = tr[8].split(": ")[1];
	let csRankPoint = tr[9].split(": ")[1];
	let accountCreated = tr[10].split(": ")[1];
	let lastLogin = tr[11].split(": ")[1];
	let preferMode = tr[12].split(": ")[1];
	let language = tr[13].split(": ")[1];
	let booyahPassPremium = tr[16].split(": ")[1];
	let booyahPassLevel = tr[17].split(": ")[1];
	let petName = tr[20].split(": ")[1] || "doesnt have pet.";
	let petLevel = tr[21].split(": ")[1] || "doesnt have pet.";
	let petExp = tr[22].split(": ")[1] || "doesnt have pet.";
	let starMarked = tr[23].split(": ")[1] || "doesnt have pet.";
	let selected = tr[24].split(": ")[1] || "doesnt have pet.";
	// Extract guild info - need to check if it exists in the result
	let guild = "Tidak memiliki guild";
	if (tr.length > 26 && tr[26]) {
		if (tr[26].includes("Guild:")) {
			guild = tr[26].split("Guild: ")[1];
		}
	}
	let equippedItems = [];
	$(".equipped-items")
		.find(".equipped-item")
		.each((i, e) => {
			let name = $(e).find("p").text().trim();
			let img = $(e).find("img").attr("src");
			equippedItems.push({
				name,
				img,
			});
		});
	return {
		name,
		bio,
		like,
		level,
		exp,
		region,
		honorScore,
		brRank,
		brRankPoint,
		csRankPoint,
		accountCreated,
		lastLogin,
		preferMode,
		language,
		booyahPassPremium,
		booyahPassLevel,
		petInformation: {
			name: petName,
			level: petLevel,
			exp: petExp,
			starMarked,
			selected,
		},
		guild,
		equippedItems,
	};
}

/*  
Created by: padz  
Note: no delete this wm  
Type: ESM  
*/

async function generateNotifyUrl(name, ppurl, bgurl, type) {
	const apiUrl = "https://editor.vreden.my.id/notify";
	const params = new URLSearchParams({
		name,
		profile: ppurl,
		background: bgurl,
		type,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateQrisUrl(qrisurl, amount, exp, storename) {
	const apiUrl = "https://editor.vreden.my.id/qris";
	const params = new URLSearchParams({
		url: qrisurl,
		nominal: amount,
		expired: exp,
		store: storename,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateTiktokUrl(
	ppurl,
	username,
	followers,
	following,
	like,
	bio,
	website,
) {
	const apiUrl = "https://editor.vreden.my.id/tiktok";
	const params = new URLSearchParams({
		profile: ppurl,
		username: `@${username}`,
		followers,
		following,
		like,
		bio,
		website,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateYoutubeUrl(username, ppurl, sub, views, videos, bio) {
	const apiUrl = "https://editor.vreden.my.id/youtube";
	const params = new URLSearchParams({
		username,
		profile: ppurl,
		subscribers: sub,
		views,
		video: videos,
		bio,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateInstagramUrl(
	ppurl,
	username,
	full_name,
	category,
	followers,
	following,
	post,
	bio,
	website,
) {
	const apiUrl = "https://editor.vreden.my.id/instagram";
	const params = new URLSearchParams({
		profile: ppurl,
		username,
		full_name,
		category,
		followers,
		following,
		post,
		bio,
		website,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateRankUrl(
	bgurl,
	rankId,
	ppurl,
	currentExp,
	maxExp,
	maxColor,
	strokeColor,
	currentColor,
	expColor,
	expNumberColor,
	levelColor,
	name,
	nameColor,
	users,
	rank,
	rankColor,
	balance,
	limit,
	level,
) {
	const apiUrl = "https://editor.vreden.my.id/rank";
	const params = new URLSearchParams({
		background: bgurl,
		rankId,
		profile: ppurl,
		currentExp,
		maxExp,
		maxColor,
		strokeColor,
		currentColor,
		expColor,
		expNumberColor,
		levelColor,
		name,
		nameColor,
		users,
		rank,
		rankColor,
		balance,
		limit,
		level,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateTopGlobalUrl(
	bgurl,
	rank1,
	rank2,
	rank3,
	point1,
	point2,
	point3,
	users1,
	users2,
	users3,
	rankid1,
	rankid2,
	rankid3,
	profile1,
	profile2,
	profile3,
) {
	const apiUrl = "https://editor.vreden.my.id/topglobal";
	const params = new URLSearchParams({
		background: bgurl,
		rank1,
		rank2,
		rank3,
		point1,
		point2,
		point3,
		users1,
		users2,
		users3,
		rankid1,
		rankid2,
		rankid3,
		profile1,
		profile2,
		profile3,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateTransactionUrl(
	date,
	id,
	product,
	tujuan,
	nickname,
	nominal,
	serial,
	store,
	status,
) {
	const apiUrl = "https://editor.vreden.my.id/transaksi";
	const params = new URLSearchParams({
		date,
		id,
		product,
		tujuan,
		nickname,
		nominal,
		serial,
		store,
		status,
	}).toString();
	return `${apiUrl}?${params}`;
}

async function generateReceiptUrl(
	tanggal,
	serial,
	status,
	id,
	reff_id,
	code,
	product,
	tujuan,
	note,
	nominal,
	admin,
	total,
	store,
) {
	const apiUrl = "https://editor.vreden.my.id/struk";
	const params = new URLSearchParams({
		tanggal,
		serial,
		status,
		id,
		reff_id,
		code,
		product,
		tujuan,
		note,
		nominal,
		admin,
		total,
		store,
	}).toString();
	return `${apiUrl}?${params}`;
}

export {
	generateNotifyUrl,
	generateQrisUrl,
	generateTiktokUrl,
	generateYoutubeUrl,
	generateInstagramUrl,
	generateRankUrl,
	generateTopGlobalUrl,
	generateTransactionUrl,
	generateReceiptUrl,
};

export const isOwner = (sender, ownerNumber) => {
	return ownerNumber.includes(sender);
};

export const isGroup = (chat) => {
	return chat.endsWith("@g.us");
};

export const isPrivate = (chat) => {
	return chat.endsWith("@s.whatsapp.net");
};

export const isRegister = (sender, registeredUsers) => {
	return registeredUsers.includes(sender);
};
