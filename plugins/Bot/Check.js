import { loadConfig } from "./Autoread.js";
import { loadSholat } from "./Autosholat.js";
import { loadAutoAI } from "./Autoai.js";
import { loadAntispam } from "./Antispam.js";
import { loadAntilink } from "./Antilink.js";
import { loadAntimedia } from "./Antimedia.js";
import { loadAntibad } from "./Antibad.js";

export default {
	command: ".cek",
	name: "「 CHECKER ON/OFF 」",
	description: "Mengecek status on/off.",
	execute: async (sock, sender, text, msg) => {
		const sholatConfig = loadSholat();
		const readConfig = loadConfig();
		const configai = loadAutoAI();
		const antisConfig = loadAntispam();
		const antilinkConfig = loadAntilink();
		const antimedConfig = loadAntimedia();
		const antibadConfig = loadAntibad();

		let pesan = `📌 *Status Fitur*:
- *Autosholat*: ${sholatConfig.autosholat ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Autoread*: ${readConfig.autoread ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Autoai*: ${configai[sender] ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Antispam*: ${antisConfig[sender] ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Antilink*: ${antilinkConfig[sender] ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Antimedia*: ${antimedConfig[sender] ? "✅ AKTIF" : "❌ NONAKTIF"}
- *Antibad*: ${antibadConfig[sender] ? "✅ AKTIF" : "❌ NONAKTIF"}`;
		await sock.sendMessage(sender, { text: pesan });
	},
};
