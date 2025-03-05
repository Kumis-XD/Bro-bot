import dotenv from "dotenv";
import axios from "axios";
import moment from "moment";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";
import ora from "ora"; // Import library untuk animasi loading

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
