import dotenv from "dotenv";
import axios from "axios";
import moment from "moment";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";
import ora from "ora"; // Import library untuk animasi loading
import * as cheerio from "cheerio";
import FormData from "form-data";

const prayerTimesCache = new Map(); // Cache untuk menyimpan waktu sholat per hari

dotenv.config();

// Data umum
const thumb = process.env.THUMBNAIL_URL;
const botname = process.env.BOT_NAME;
const ownername = process.env.OWNER_NAME;
const desc = process.env.BOT_DESCRIPTION;

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
			audio: "https://cloudkuimages.xyz/uploads/audios/67c38e9df41d6.mp3", // File audio imsak
		},
		{
			name: "Fajr (Subuh)",
			time: prayerTimes["Fajr"],
			message: "⏰ Subuh telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://cloudkuimages.xyz/uploads/audios/67c6e563e6d36.mp3",
		},
		{
			name: "Dhuhr (Dzuhur)",
			time: prayerTimes["Dhuhr"],
			message: "⏰ Dzuhur telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://cloudkuimages.xyz/uploads/audios/67c6e51374274.mp3",
		},
		{
			name: "Asr (Ashar)",
			time: prayerTimes["Asr"],
			message: "⏰ Ashar telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://cloudkuimages.xyz/uploads/audios/67c6e51374274.mp3",
		},
		{
			name: "Maghrib",
			time: prayerTimes["Maghrib"],
			message: "⏰ Maghrib telah tiba! Waktunya berbuka puasa. 🌙",
			audio: "https://cloudkuimages.xyz/uploads/audios/67c6e51374274.mp3",
		},
		{
			name: "Isha (Isya)",
			time: prayerTimes["Isha"],
			message: "⏰ Isya telah tiba! Jangan lupa sholat. 🕌",
			audio: "https://cloudkuimages.xyz/uploads/audios/67c6e51374274.mp3",
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
						thumbnailUrl:
							"https://cloudkuimages.xyz/uploads/images/67c4243ecf8a1.jpg",
						renderLargerThumbnail: true,
						mediaType: 1,
						mediaUrl:
							"https://cloudkuimages.xyz/uploads/images/67c4243ecf8a1.jpg",
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
