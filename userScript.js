// ==UserScript==
// @name         Better AutomationAnywhere
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  Enhanced Automation Anywhere developer experience
// @author       jamir-boop
// @match        *://*.automationanywhere.digital/*
// @icon         https://cmpc-1dev.my.automationanywhere.digital/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
	"use strict";
	let activePredictionIndex = -1; // Track the active (highlighted) prediction
	let currentPredictionActions = []; // Store current predictions' actions for keyboard navigation

	// Universal Copy and Paste functionality with 3 slots

	// Register menu commands for selecting copy/paste slots
	GM_registerMenuCommand("Copy to Slot 1", () => copyToSlot(1));
	GM_registerMenuCommand("Copy to Slot 2", () => copyToSlot(2));
	GM_registerMenuCommand("Copy to Slot 3", () => copyToSlot(3));
	GM_registerMenuCommand("Paste from Slot 1", () => pasteFromSlot(1));
	GM_registerMenuCommand("Paste from Slot 2", () => pasteFromSlot(2));
	GM_registerMenuCommand("Paste from Slot 3", () => pasteFromSlot(3));

	// Commands and their aliases mapping to functions
	const commandsWithAliases = {
		addAction: {
			action: addAction,
			aliases: ["a", "addaction", "add action", "action"],
			description: "Shows actions in sidebar",
		},
		addVariable: {
			action: addVariable,
			aliases: ["adv", "addvar", "add variable"],
			description: "Shows dialog to create a new variable",
		},
		showVariables: {
			action: showVariables,
			aliases: ["v", "showvars", "list variables", "variables"],
			description: "Shows variables in sidebar",
		},
		deleteUnusedVariables: {
			action: deleteUnusedVariables,
			aliases: ["duv", "delete unused", "remove unused variables"],
			description: "Shows dialog to select and delete unused variables",
		},
		updatePackages: {
			action: updatePackages,
			aliases: ["up", "updatepkgs", "upgrade packages"],
			description: "Opens the packages menu and unfolds the updatable items",
		},
		foldAll: {
			action: foldAll,
			aliases: ["fa", "fold all", "collapse all"],
			description: "Folds all sections in the code",
		},
		redirectToPrivateRepository: {
			action: redirectToPrivateRepository,
			aliases: ["p", "private", "private bots"],
			description: "Redirects to the private bots folder",
		},
		redirectToActivityHistorical: {
			action: redirectToActivityHistorical,
			aliases: ["historical", "history","activity historical"],
			description: "Redirects to the activities historical tab",
		},
		pasteLogToFile: {
			action: pasteLogToFile,
			aliases: ["log"],
			description: "Pastes log entries at the selected line in the task bot. If a version error occurs, the specified version will be saved for future use.",
		},
		showHelp: {
			action: function () {
				showHelp();
			},
			aliases: ["help", "man", "show help"],
			description: "Displays help information for available commands",
		},
	};

	//============ Command palette START ============
	// Helper function to get DOM elements dynamically
	function getCommandPalette() {
		return document.getElementById("commandPalette");
	}

	function getCommandInput() {
		return document.getElementById("commandInput");
	}

	function getCommandPredictions() {
		return document.getElementById("commandPredictions");
	}

	// Toggle palette visibility
	function togglePaletteVisibility() {
		const commandPalette = getCommandPalette();
		if (commandPalette.classList.contains("command_palette--visible")) {
			commandPalette.classList.remove("command_palette--visible");
			commandPalette.classList.add("command_palette--hidden");
			getCommandInput().value = ""; // Clear input on hide
			clearPredictions(); // Clear predictions on hide
		} else {
			commandPalette.classList.remove("command_palette--hidden");
			commandPalette.classList.add("command_palette--visible");
			getCommandInput().focus(); // Focus on the input field when showing the palette
		}
	}

	function clearPredictions() {
		getCommandPredictions().innerHTML = "";
	}

	function updatePredictions(input) {
		clearPredictions();

		if (!input) return;

		Object.entries(commandsWithAliases).forEach(
			([commandKey, { action, aliases, description }]) => {
				const match = aliases.find((alias) =>
					alias.startsWith(input.toLowerCase()),
				);
				if (match) {
					const predictionItem = document.createElement("div");
					predictionItem.classList.add("command_prediction-item");
					predictionItem.innerHTML = `<strong>${match}</strong> - ${description}`;
					predictionItem.addEventListener("click", () => {
						getCommandInput().value = match;
						executeCommand(action);
						clearPredictions();
					});
					getCommandPredictions().appendChild(predictionItem);
				}
			},
		);
	}

	// Function to setup event listeners for commandInput
	function setupCommandInputEventListeners() {
		const commandInput = getCommandInput(); // Ensure we're getting the current element

		if (commandInput) {
			// Input event listener for updating predictions
			commandInput.addEventListener("input", function () {
				updatePredictions(this.value);
			});

			// Keydown event listener for navigating and selecting predictions
			commandInput.addEventListener("keydown", navigatePredictions);
		}
	}

	// Execute command function based on input or selected prediction
	function executeCommand(action) {
		if (action) {
			action();
		} else {
			showHelp(); // Show help or error if command is unknown
		}
		togglePaletteVisibility(); // Hide palette after executing command
	}

	function navigatePredictions(e) {
		let commandPredictions = getCommandPredictions();
		const items = commandPredictions.getElementsByClassName(
			"command_prediction-item",
		);
		if (!items.length) {
			if (e.key === "Escape") {
				togglePaletteVisibility();
				e.preventDefault();
			}
			return;
		}

		// Automatically select the prediction if there's only one and Enter is pressed
		if (items.length === 1 && e.key === "Enter") {
			items[0].click(); // Execute the single available command
			e.preventDefault();
			return;
		}

		if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
			e.preventDefault(); // Prevent default only for navigation keys

			if (e.key === "ArrowDown") {
				activePredictionIndex = (activePredictionIndex + 1) % items.length;
				updateActivePrediction(items);
			} else if (e.key === "ArrowUp") {
				if (activePredictionIndex <= 0) {
					activePredictionIndex = items.length - 1;
				} else activePredictionIndex -= 1;
				updateActivePrediction(items);
			} else if (e.key === "Enter" && activePredictionIndex >= 0) {
				items[activePredictionIndex].click();
			}
		} else if (e.key === "Escape") {
			togglePaletteVisibility();
			e.preventDefault();
		}
	}

	function updateActivePrediction(items) {
		Array.from(items).forEach((item, index) => {
			item.classList.toggle("active", index === activePredictionIndex);
		});
	}

	// Toggle command palette visibility with Shift+C
	document.addEventListener("keydown", function (e) {
		if (e.altKey && e.key === "p") {
			e.preventDefault();
			//insertCommandPalette();
			insertCustomEditorPaletteButtons();
			togglePaletteVisibility();
		}
	});

	// Shortcuts to show Actions/Variables
	document.addEventListener("keydown", function (e) {
		if (e.code === "KeyA" && e.altKey) {
			addAction();
			e.preventDefault(); // Prevent default action of Alt+A
		}
	});

	document.addEventListener("keydown", function (e) {
		if (e.code === "KeyV" && e.altKey) {
			showVariables();
			e.preventDefault(); // Prevent default action of Alt+V
		}
	});

	// Shortcuts to toggle sidebar
	document.addEventListener("keydown", function (e) {
		if (e.ctrlKey && e.code === "KeyD") {
			(function () {
				toogleToolbar();
			})();
			e.preventDefault();
		}
	});

	// Function to toggle toolbar
	function toogleToolbar() {
		document
			.querySelector(
				"div.editor-layout__resize:nth-child(2) > button:nth-child(2)",
			)
			.click();
	}

	// Function to check if toolbar is opened
	function checkPaletteState() {
		let paletteElement = document.querySelector(".editor-layout__palette");
		let width = paletteElement.offsetWidth; // Get the actual width

		if (width <= 8) {
			return "closed";
		} else {
			return "opened";
		}
	}

	// Features
	function addAction() {
		const state = checkPaletteState();

		if (state === "closed") {
			toogleToolbar(); // Open the toolbar if it's closed
		}

		try {
			document
				.querySelector(
					"div.editor-palette__accordion:nth-child(2) > div:nth-child(1) > header:nth-child(1) > div:nth-child(1) > button:nth-child(1) > div:nth-child(1) > div:nth-child(2)",
				)
				.click();
		} catch {}
		try {
			document
				.querySelector(
					'.editor-palette-search__cancel button[type="button"][tabindex="-1"]',
				)
				.click();
		} catch {}
	}

	function addVariable() {
		const state = checkPaletteState();

		if (state === "closed") {
			toogleToolbar(); // Open the toolbar if it's closed
		}

		try {
			const accordion = document.querySelector(
				"div.editor-palette__accordion:nth-child(1)",
			);
			const addButton = accordion.querySelector(
				"header:nth-child(1) button:nth-child(1)",
			);
			addButton.click();
		} catch (error) {}

		try {
			const cancelButton = document.querySelector(
				"div.editor-palette-search__cancel button",
			);
			cancelButton.click();
		} catch (error) {}

		try {
			const createButton = document.querySelector('button[name="create"]');
			createButton.click();
		} catch (error) {}

		try {
			const confirmButton = document.querySelector(
				"div.action-bar--theme_default:nth-child(1) > button:nth-child(2)",
			);
			confirmButton.click();
		} catch (error) {}
	}

	function showVariables() {
		const state = checkPaletteState();

		if (state === "closed") {
			toogleToolbar(); // Open the toolbar if it's closed
		}
		document
			.querySelector(
				'span.clipped-text.clipped-text--no_wrap.editor-palette-section__header-title[title="Variables"]',
			)
			?.click();
	}

	function showTriggers() {
		const state = checkPaletteState();

		if (state === "closed") {
			toogleToolbar(); // Open the toolbar if it's closed
		}
		document
			.querySelector(
				'span.clipped-text.clipped-text--no_wrap.editor-palette-section__header-title[title="Triggers"]',
			)
			?.click();
	}

	function deleteUnusedVariables() {
		const state = checkPaletteState();

		if (state === "closed") {
			toogleToolbar(); // Open the toolbar if it's closed
		}
		const accordion = document.querySelector(
			"div.editor-palette__accordion:nth-child(1)",
		);
		const addButton = accordion.querySelector(
			"header:nth-child(1) button:nth-child(1)",
		);
		addButton.click();
		const menuButton = document.querySelector(
			"button.action-bar__item--is_menu:nth-child(5)",
		);
		menuButton.click();
		const deleteButton = document.querySelector(
			"button.rio-focus--inset_4px:nth-child(2)",
		);
		deleteButton.click();
	}

	function openLinkInNewTab(url) {
		var newWindow = window.open(url, "_blank");
		if (newWindow) {
			newWindow.blur();
			window.focus();
		} else {
			alert("Pop-up blocked. Please allow pop-ups for this website.");
		}
	}

	function foldAll() {
		const folderClicks = document.querySelectorAll(
			".taskbot-canvas-list-node__collapser",
		);
		Array.from(folderClicks)
			.reverse()
			.forEach((element) => element.click());
	}

	function showHelp() {
		// Create modal elements
		const modalOverlay = document.createElement('div');
		const modal = document.createElement('div');
		const modalContent = document.createElement('div');
		const closeButton = document.createElement('button');

		// Set styles for the modal
		modalOverlay.style.position = 'fixed';
		modalOverlay.style.top = '0';
		modalOverlay.style.left = '0';
		modalOverlay.style.width = '100vw';
		modalOverlay.style.height = '100vh';
		modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modalOverlay.style.display = 'flex';
		modalOverlay.style.justifyContent = 'center';
		modalOverlay.style.alignItems = 'center';
		modalOverlay.style.zIndex = '1000'; // Ensure it appears above other elements

		modalOverlay.style.fontSize = '16px';

		modal.style.backgroundColor = 'white';
		modal.style.padding = '20px';
		modal.style.borderRadius = '8px';
		modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
		modal.style.maxWidth = '800px';
		modal.style.width = '80%';
		modal.style.position = 'relative';

		// Build the help content from the commandsWithAliases object
		let helpContent = "<h3>List of Commands:</h3><ul>";

		for (let command in commandsWithAliases) {
			const { aliases, description } = commandsWithAliases[command];
			helpContent += `<li><b>${aliases.join(', ')}:</b> ${description}</li>`;
		}

		helpContent += "</ul>";

		modalContent.innerHTML = helpContent;

		closeButton.textContent = 'Close';
		closeButton.style.marginTop = '10px';
		closeButton.style.padding = '8px 16px';
		closeButton.style.border = 'none';
		closeButton.style.backgroundColor = 'var(--color_background_interactive)';
		closeButton.style.color = 'white';
		closeButton.style.cursor = 'pointer';
		closeButton.style.borderRadius = '4px';

		// Append elements
		modal.appendChild(modalContent);
		modal.appendChild(closeButton);
		modalOverlay.appendChild(modal);
		document.body.appendChild(modalOverlay);

		// Close function
		function closeModal() {
			document.body.removeChild(modalOverlay);
		}

		// Close when clicking outside the modal
		modalOverlay.addEventListener('click', (e) => {
			if (e.target === modalOverlay) {
				closeModal();
			}
		});

		// Close on Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				closeModal();
			}
		});

		// Close on button click
		closeButton.addEventListener('click', closeModal);
	}
	//============ Command palette stuff END ============

	//============ Feat updatePackages stuff START ============
	function updatePackages() {
		document
			.querySelector(".rio-icon--icon_three-vertical-dots-meatball-menu")
			.click();

		function clickSpanWithText(text) {
			var spans = document.querySelectorAll(
				"span.clipped-text.clipped-text--no_wrap.dropdown-option-label span.clipped-text__string",
			);
			for (var i = 0; i < spans.length; i++) {
				if (spans[i].textContent.toLowerCase().includes(text.toLowerCase())) {
					spans[i].click();
					break;
				}
			}
		}

		// Call the function with "package"
		clickSpanWithText("packages");

		document
			.querySelectorAll('.package-resource__title[title*="not default"]')
			.forEach((span) => {
				// Simulate a click on the span
				span.click();

				// Wait for the DOM changes to occur after the click, then perform further actions
				setTimeout(() => {
					let versionCell = span.querySelector(
						".taskbot-edit-page__package__versions__cell.taskbot-edit-page__package__versions__cell--select",
					);
					if (versionCell) {
						versionCell.click();

						// Wait for the dropdown to appear, then perform further actions
						setTimeout(() => {
							let option = versionCell.querySelector(
								'.choice-input-dropdown__options .choice-input-dropdown__option[role="option"]',
							);
							if (option) {
								option.click();
							}
						}, 5000); // Adjust the timeout as needed
					}
				}, 3000); // Adjust the timeout as needed
			});
	}
	//============ Feat updatePackages stuff END ============
	//============ Feat snippets START ============
	function generateEmojiString() {
		const emojis = [
			"😀",
			"😃",
			"😄",
			"😁",
			"😆",
			"😅",
			"😂",
			"🤣",
			"😊",
			"😇",
			"🙂",
			"🙃",
			"😉",
			"😌",
			"😍",
			"🥰",
			"😘",
			"😗",
			"😙",
			"😚",
			"😋",
			"😛",
			"😝",
			"😜",
			"🤪",
			"🤨",
			"🧐",
			"🤓",
			"😎",
			"🤩",
			"🥳",
			"😏",
			"😒",
			"😞",
			"😔",
			"😟",
			"😕",
			"🙁",
			"😣",
			"😖",
			"😫",
			"😩",
			"🥺",
			"😢",
			"😭",
			"😤",
			"😠",
			"😡",
			"🤬",
			"🤯",
			"😳",
			"🥵",
			"🥶",
			"😱",
			"😨",
			"😰",
			"😥",
			"😓",
			"🤗",
			"🤔",
			"🤭",
			"🤫",
			"🤥",
			"😶",
			"😐",
			"😑",
			"😬",
			"🙄",
			"😯",
			"😦",
			"😧",
			"😮",
			"😲",
			"🥱",
			"😴",
			"🤤",
			"😪",
			"😵",
			"🤐",
			"🥴",
			"🤢",
			"🤮",
			"🤧",
			"😷",
			"🤒",
			"🤕",
			"🤑",
			"🤠",
			"😈",
			"👿",
			"👹",
			"👺",
			"🤡",
			"💩",
			"👻",
			"💀",
			"☠️",
			"👽",
			"👾",
			"🤖",
			"🎃",
			"😺",
			"😸",
			"😹",
			"😻",
			"😼",
			"😽",
			"🙀",
			"😿",
			"😾",
		];
		let uniqueString = "";

		for (let i = 0; i < 10; i++) {
			uniqueString += emojis[Math.floor(Math.random() * emojis.length)];
		}

		return uniqueString;
	}


	function getSelectedLineNumber() {
		/**
		 * Function to get the inner text of the number element based on its relation to the title element.
		 * It searches for the title element, finds its parent div, and retrieves the text from the sibling element
		 * with the class `.taskbot-canvas-list-node__number.taskbot-canvas-list-node__number--clickable`.
		 * @returns {string|null} The inner text of the number element, or null if not found.
		 */
		// Select the element with the title class
		const divSeleccionado = document.querySelector('.taskbot-canvas-list-node__title.taskbot-canvas-list-node__title--cursor.taskbot-canvas-list-node__title--cursor-pivot');

		if (divSeleccionado) {
			const parentDiv = divSeleccionado.closest('div.taskbot-canvas-list-node.taskbot-canvas-list-node--mode-edit');

			if (parentDiv) {
				const numberElement = parentDiv.querySelector('.taskbot-canvas-list-node__number.taskbot-canvas-list-node__number--clickable');

				if (numberElement) {
					return numberElement.innerText;
				} else {
					console.log('Number element not found');
					return null;
				}
			} else {
				console.log('Parent div not found');
				return null;
			}
		} else {
			console.log('Title element not found');
			return null;
		}
	}

	function setGMPackageUsedVersionFromErrorMessage() {
		const element = document.querySelector(".message__content");

		if (element) {
			const text = element.innerText;
			let GMKey;
			if (text.includes("Log To File")) {
				GMKey = "logToFilePackageVersion";
			} else if (text.includes("System")) {
				GMKey = "systemPackageVersion";
			}

			const versionMatch = text.match(/Used version:\s*([\d.]+)/);

			if (versionMatch && GMKey) {
				// Save the version using GM_setValue if GMKey is defined
				GM_setValue(GMKey, versionMatch[1]);
				console.log("Log to file action used version: " + versionMatch[1]);
			}
		}
	}

	function pasteLogToFile(){
		let selectedLine = Number(getSelectedLineNumber());
		selectedLine += 1;

		let logToFilePackageVersion = GM_getValue('logToFilePackageVersion');
		if (logToFilePackageVersion == null || logToFilePackageVersion.trim() === ""){
			logToFilePackageVersion = "3.8.0";
		}

		let systemPackageVersion = GM_getValue('systemPackageVersion');
		if (systemPackageVersion == null || systemPackageVersion.trim() === ""){
			systemPackageVersion = "3.14.0";
		}

		let logJsonData = {
		  "uid": "🔥🔥🔥",
		  "sourceFileId": "",
		  "sourceWorkspaceName": "private",
		  "nodes": [
			{
			  "uid": "7b44b830-ce6e-4bc8-b95e-f42bfb84e9a3",
			  "commandName": "logToFile",
			  "packageName": "LogToFile",
			  "disabled": false,
			  "attributes": [
				{
				  "name": "filePath",
				  "value": {
					"type": "FILE",
					"expression": "file://$iDictConfig{vBaseInstancia}$$iDictConfig{vArchivoLog}$"
				  }
				},
				{
				  "name": "logContent",
				  "value": {
					"type": "STRING",
					"expression": "Task:$System:AATaskName$ | User: $System:AATaskExecutor{Executor_UserName}$ | Line: " + selectedLine + " | "
				  }
				},
				{
				  "name": "appendTimestamp",
				  "value": {
					"type": "BOOLEAN",
					"boolean": true
				  }
				},
				{
				  "name": "logOption",
				  "value": {
					"type": "STRING",
					"string": "APPEND_FILE"
				  }
				},
				{
				  "name": "encodingValue",
				  "value": {
					"type": "STRING",
					"string": "ANSI"
				  }
				}
			  ]
			}
		  ],
		  "packages": [
			{
			  "name": "LogToFile",
			  "version": logToFilePackageVersion
			},
			{
			  "name": "System",
			  "version": systemPackageVersion
			}
		  ]
		};

		GM_setValue('universalClipboard', JSON.stringify(logJsonData));
		universalPaste();

		setTimeout(setGMPackageUsedVersionFromErrorMessage, 1000);
	}

	//============ Feat snippets END ============
	//============ Feat custom selector Variables/Actions/Triggers START============

	// Define updateActiveButton in the outer scope
	function updateActiveButton() {
		const activeSection = document.querySelector(
			".editor-palette-section__header--is_active .clipped-text__string--for_presentation",
		)?.innerText;
		const buttons = document.querySelectorAll(".customActionVariableButton");

		buttons.forEach((button) => {
			if (button.textContent === activeSection) {
				button.classList.add("buttonToolbarActive");
			} else {
				button.classList.remove("buttonToolbarActive");
			}
		});
	}

	function insertCustomEditorPaletteButtons() {
		if (document.getElementById("customActionVariableButtons")) {
			console.log("Custom buttons already added.");
			return;
		}

		const containerDiv = document.createElement("div");
		containerDiv.id = "customActionVariableButtons";

		const variableButton = document.createElement("button");
		variableButton.className = "customActionVariableButton";
		variableButton.textContent = "Variables";
		variableButton.onclick = function () {
			showVariables();
			updateActiveButton();
		};

		const actionButton = document.createElement("button");
		actionButton.className = "customActionVariableButton";
		actionButton.textContent = "Actions";
		actionButton.onclick = function () {
			addAction();
			updateActiveButton();
		};

		const triggerButton = document.createElement("button");
		triggerButton.className = "customActionVariableButton";
		triggerButton.textContent = "Triggers";
		triggerButton.onclick = function () {
			showTriggers();
			updateActiveButton();
		};

		containerDiv.appendChild(variableButton);
		containerDiv.appendChild(actionButton);
		containerDiv.appendChild(triggerButton);

		const palette = document.querySelector(".editor-layout__palette");
		if (palette) {
			palette.appendChild(containerDiv);
		} else {
			console.log(".editor-layout__palette not found.");
			return;
		}

		const style = document.createElement("style");
		style.textContent = `
		#customActionVariableButtons {
			display: flex;
			width: 100%;
			height: 38px !important;
			background: white;
		}
		#customActionVariableButtons button {
			all: unset;
			font-size: .85rem;
			font-weight: 300;
			cursor: pointer;
			margin: 4px;
			border-radius: 5px;
			border: 1px solid transparent;
			background-color: transparent;
			color: #3c5e83;
			flex-grow: 1;
			text-align: center;
			transition: background-color 0.3s;
		}
		#customActionVariableButtons button:hover {
			background-color: #dae9f3;
		}
		.buttonToolbarActive {
			border: 1px solid #3c5e83 !important;
			text-shadow: 0.5px 0 0 #3c5e83 , -0.01px 0 0 #3c5e83 !important;
		}
		.editor-palette.g-box-sizing_border-box {
			margin-top: 38px;
		}
	`;
		document.head.appendChild(style);
	}
	//============ Feat custom selector Variables/Actions/Triggers END============
	//============ Feat UNIVERSAL COPY/PASTE START============
	// Function to copy data to the specified slot
	function copyToSlot(slot) {
		// Trigger the copy action in the UI
		const copyButton = document.querySelector(".aa-icon-action-clipboard-copy--shared");
		if (copyButton) {
			copyButton.click();

			// Retrieve the JSON string from localStorage
			const globalClipboardJSON = localStorage.getItem('globalClipboard');

			// Parse the JSON and store it in the specific slot using Tampermonkey storage
			try {
				const clipboardData = JSON.parse(globalClipboardJSON);
				clipboardData.uid = "🔥🔥🔥"; // Reset UID
				GM_setValue(`universalClipboardSlot${slot}`, JSON.stringify(clipboardData));
			} catch (error) {
				console.error("Failed to copy data to slot:", error);
			}
		}
	}

	// Function to paste data from the specified slot
	function pasteFromSlot(slot) {
		// Retrieve the JSON string from the specified slot in Tampermonkey storage
		const clipboardData = GM_getValue(`universalClipboardSlot${slot}`);

		if (!clipboardData) {
			alert(`No data in Slot ${slot}`);
			return;
		}

		// Generate a new unique ID for this session
		let emojiUid = generateEmojiString();

		// Replace the UID and store it back into localStorage
		let modifiedData = clipboardData.replace(/🔥🔥🔥/g, emojiUid);
		localStorage.setItem('globalClipboard', modifiedData);
		localStorage.setItem('globalClipboardUid', `"${emojiUid}"`);

		// Ensure the paste button is available
		const pasteButton = document.querySelector(".aa-icon-action-clipboard-paste--shared");
		if (pasteButton) {
			// Trigger the paste action
			setTimeout(() => {
				pasteButton.click();
			}, 500); // Adjust the timeout as needed
		}
	}

	function insertUniversalCopyPasteButtons(attempt = 1) {
		setTimeout(() => {
			const actionBar = document.querySelector('.action-bar--theme_info');

			// If actionBar is found and the buttons have not been added yet
			if (actionBar && !actionBar.querySelector('.universalCopy')) {
				const separator = document.createElement('div');
				separator.className = 'action-bar__separator';
				actionBar.appendChild(separator);

				// Create the Universal Copy button
				const copyButton = document.createElement('button');
				copyButton.className = 'universalCopy rio-focus rio-focus--inset_0 rio-focus--border-radius_4px rio-focus--has_element-focus-visible rio-bare-button g-reset-element rio-bare-button--rio_interactive-softest rio-bare-button--is_parent rio-bare-button--is_clickable rio-bare-button--size_14px rio-bare-button--is_square rio-bare-button--square_26x26 action-bar__item action-bar__item--is_action taskbot-editor__toolbar__action';
				copyButton.setAttribute('data-button-loading', 'false');
				copyButton.setAttribute('data-button-working', 'false');
				copyButton.setAttribute('data-button-ready', 'true');
				copyButton.setAttribute('name', 'shared-clipboard-copy');
				copyButton.setAttribute('type', 'button');
				copyButton.setAttribute('tabindex', '-1');
				copyButton.setAttribute('aria-label', 'Copy to shared clipboard');
				copyButton.setAttribute('data-poppy-parentid', '1');
				copyButton.innerHTML = `<span class="icon fa fa-rocket icon--block"></span>`;
				copyButton.title = 'Universal Copy';
				copyButton.onclick = universalCopy;
				actionBar.appendChild(copyButton);

				// Create the Universal Paste button
				const pasteButton = document.createElement('button');
				pasteButton.className = 'universalPaste rio-focus rio-focus--inset_0 rio-focus--border-radius_4px rio-focus--has_element-focus-visible rio-bare-button g-reset-element rio-bare-button--rio_interactive-softest rio-bare-button--is_parent rio-bare-button--is_clickable rio-bare-button--size_14px rio-bare-button--is_square rio-bare-button--square_26x26 action-bar__item action-bar__item--is_action taskbot-editor__toolbar__action';
				pasteButton.setAttribute('data-button-loading', 'false');
				pasteButton.setAttribute('data-button-working', 'false');
				pasteButton.setAttribute('data-button-ready', 'true');
				pasteButton.setAttribute('name', 'shared-clipboard-paste');
				pasteButton.setAttribute('type', 'button');
				pasteButton.setAttribute('tabindex', '-1');
				pasteButton.setAttribute('aria-label', 'Paste from shared clipboard');
				pasteButton.setAttribute('data-poppy-parentid', '1');
				pasteButton.innerHTML = `<span class="icon fa fa-rocket icon--block" style="transform: rotate(180deg);"></span>`;
				pasteButton.title = 'Universal Paste';
				pasteButton.onclick = universalPaste;
				actionBar.appendChild(pasteButton);
			} else if (attempt < 3) {
				// If not found, retry up to 3 times
				insertUniversalCopyPasteButtons(attempt + 1);
			}
		}, 1000 * attempt); // Delay increases with each attempt
	}


	function universalCopy() {
		// Trigger the copy action in the UI
		document.querySelector(".aa-icon-action-clipboard-copy--shared").click();

		// Retrieve the JSON string from local storage
		const globalClipboardJSON = localStorage.getItem('globalClipboard');

		// Parse the JSON string into an object
		let globalClipboard = {};
		try {
			globalClipboard = JSON.parse(globalClipboardJSON);
		} catch(e) {
			console.error("Error parsing JSON:", e);
			return;  // Exit if there is a parsing error
		}

		// Update the "uid" key to 🔥🔥🔥
		globalClipboard.uid = "🔥🔥🔥";

		// Stringify the modified object and store it in Tampermonkey storage
		GM_setValue('universalClipboard', JSON.stringify(globalClipboard));
	}

	function universalPaste() {
		// Click on copy to activate paste button
		document.querySelector(".aa-icon-action-clipboard-copy--shared").click();

		// Retrieve the JSON string from Tampermonkey storage
		let universalClipboard = GM_getValue('universalClipboard')

		// Write the JSON string to local storage after replacing single quotes and UID
		if (universalClipboard) {
			let emojiUid = generateEmojiString();
			universalClipboard = universalClipboard.replace(/'/g, '"');
			universalClipboard = universalClipboard.replace(/🔥🔥🔥/g, emojiUid);

			localStorage.setItem("globalClipboard", universalClipboard);
			localStorage.setItem("globalClipboardUid", `"${emojiUid}"`);
		}

		// Wait for a second before triggering the paste action
		setTimeout(() => {
			document.querySelector(".aa-icon-action-clipboard-paste--shared").click();
		}, 1000);
	}
	//============ Feat UNIVERSAL COPY/PASTE END============
	//============ Feat redirect utility START ============
	function redirectToPath(targetPath) {
		const currentUrl = window.location.href;

		// Match the base URL, keeping everything up to the first part of the domain and protocol.
		const pattern = /^(https:\/\/[^\/]*\.automationanywhere\.digital)/;

		// Extract the base URL using the pattern
		const match = currentUrl.match(pattern);

		if (match) {
			const baseUrl = match[1]; // Get the base URL (e.g., https://aa-saleseng-us-4sbx.cloud.automationanywhere.digital)
			const newUrl = baseUrl + targetPath; // Append the target path
			window.location.href = newUrl; // Redirect to the new URL
		} else {
			console.error("Pattern didn't match. The URL might not be in the expected format.");
		}
	}

	// Function to redirect to the private bots repository
	function redirectToPrivateRepository() {
		const privateBotsPath = '/#/bots/repository/private/';
		redirectToPath(privateBotsPath);
	}

	// Function to redirect to the activity historical page
	function redirectToActivityHistorical() {
		const activityHistoricalPath = '/#/activity/historical/';
		redirectToPath(activityHistoricalPath);
	}
	//============ Feat redirect utility END ============
	//============ Feat insert command palette START ============
	// Insterts the command palette
	function insertCommandPalette(retryCount = 0) {
		// Check if the palette was already inserted
		if (document.querySelector("#commandPalette")) {
			console.log("Command palette already inserted.");
			return;
		}

		// Create the container div and set its inner HTML
		const containerDiv = document.createElement("div");
		containerDiv.id = "commandPalette";
		containerDiv.className = "command_palette--hidden";
		containerDiv.innerHTML = `
			<input type="text" id="commandInput" placeholder="Enter command...">
			<div id="commandPredictions" class="command_predictions"></div>
		`;

		// Append the container div to the body
		document.body.appendChild(containerDiv);

		// Create and insert CSS
		const css = `
			#commandPalette * {
				font-size: 1.15rem;
				font-family: Museo Sans,sans-serif;
			}

			#commandPalette {
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background-color: white;
				border-radius: 10px 10px 0 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				min-width: 30vw;
				max-width: 80vw;
				width: 600px;
				z-index: 99999;

				box-shadow: 0px 0px 0px 5000px #00000054;
			}

			#commandInput,
			#commandInput:focus-visible,
			#commandInput:active {
				unset: all;
				padding: 10px;
				width: 93%;
				margin-bottom: 10px;
				border: 2px solid transparent;
				border-radius: 5px;
			}

			#commandPalette:focus,
			#commandPalette:active {
				border-color: orange;
			}

			#commandPredictions {
				position: absolute;
				top: 100%;
				left: 0;
				width: 100%;
				background-color: white;
				box-shadow: 0 4px 8px rgba(0,0,0,0.1);
				border-radius: 0 0 10px 10px;
				max-height: 200px;
				overflow-y: auto;
				z-index: 100000;
			}

			.command_prediction-item.active {
				background-color: #f0f0f0;
			}

			.command_prediction-item strong {
				font-weight: bold;
			}

			.command_prediction-item {
				padding: 8px;
				cursor: pointer;
				border-bottom: 1px solid #eee;
			}

			.command_prediction-item:hover,
			.command_prediction-item.active {
				background-color: #f0f0f0;
			}

			@keyframes fadeIn {
				from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
				to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
			}

			@keyframes fadeOut {
				from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
				to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
			}

			.command_palette--visible {
				display: block;
				animation: fadeIn 0.25s ease-out forwards;
			}

			.command_palette--hidden {
				animation: fadeOut 0.25s ease-out forwards;
				display: none;
				pointer-events: none;
				opacity: 0;
				z-index: -1;
			}
		`;

		const style = document.createElement("style");
		style.type = "text/css";
		style.appendChild(document.createTextNode(css));
		document.head.appendChild(style);

		setupCommandInputEventListeners();

		// Check if the palette was successfully inserted, and if not, retry
		if (!document.querySelector("#commandPalette")) {
			if (retryCount < 5) {
				console.log(`Insert failed, retrying... (${retryCount + 1}/5)`);
				setTimeout(() => insertCommandPalette(retryCount + 1), 3000);
			} else {
				console.error("Failed to insert command palette after 5 retries.");
			}
		} else {
			console.log("Command palette successfully inserted.");
		}
	}
	//============ Feat insert command palette END ============

	//============ Call insert functions START ============
	function executeStartFunctionsRepeatedly() {
		let count = 0;
		const intervalId = setInterval(() => {
			insertCommandPalette();
			insertCustomEditorPaletteButtons();
			setInterval(function () {updateActiveButton();}, 1000);
			insertUniversalCopyPasteButtons();

			count++;
			if (count >= 3) {
				clearInterval(intervalId);
			}
		}, 5000); // Execute every 5 seconds
	}

	if (document.readyState === "loading") {
		// The document is still loading, wait for DOMContentLoaded
		document.addEventListener(
			"DOMContentLoaded",
			executeStartFunctionsRepeatedly,
		);
	} else {
		// The `DOMContentLoaded` event has already fired, execute immediately
		executeStartFunctionsRepeatedly();
	}

	let lastHref = document.location.href;
	setInterval(function () {
		const currentHref = document.location.href;

		if (lastHref !== currentHref) {
			lastHref = currentHref;
			insertCommandPalette();
			insertCustomEditorPaletteButtons();
			insertUniversalCopyPasteButtons();
		}
	}, 5000);

	//============ Call insert functions END ============
})();
