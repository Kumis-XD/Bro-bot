socket.on("newMessage", (data) => {
	console.log("📩 Data Masuk ke Frontend:", data); // Debugging

	const chatContainer = document.getElementById("chat-container");
	if (!chatContainer) return;

	const chatBox = document.createElement("div");
	chatBox.classList.add(
		"bg-gray-800",
		"p-4",
		"rounded-lg",
		"shadow-md",
		"flex",
		"items-start",
		"gap-3",
	);

	chatBox.innerHTML = `
        ${
			data.profileUrl
				? `<img src="${data.profileUrl}" class="w-10 h-10 rounded-full object-cover">`
				: ""
		}
        <div>
            <p class="text-sm text-gray-400">(${data.timestamp})</p>
            <span class="font-bold text-teal-400">${data.subject}</span> 
            ${data.isGroup ? '<span class="text-gray-400">(Group)</span>' : ""}
            <p class="mt-2">${data.message}</p>
        </div>
    `;

	chatContainer.appendChild(chatBox);
});
