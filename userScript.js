// ==UserScript==
// @name         Command Palette AutomationAnywhere
// @namespace    http://tampermonkey.net/
// @version      0.0.7
// @description  Enhanced Automation Anywhere developer experience
// @author       jamir-boop
// @match        *://*.my.automationanywhere.digital/*
// @icon         https://cmpc-1dev.my.automationanywhere.digital/favicon.ico
// @grant        none
// @license      MIT
// @require      https://raw.githubusercontent.com/Jamir-boop/AutomationAnywhere_CommandPalette/main/snippets.js?323ae4e
// ==/UserScript==

(function() {
	'use strict';
	const configLink = "";
	const eventLink = "";
	const filesLink = "";

	//============ Command palette START ============
	const commands = {
		a: addAction,
		adv: addVariable,
		v: showVariables,
		duv: deleteUnusedVariables,
		up: updatePackages,
		fa: foldAll,
		hd: hideDialog,
        comment: function(){
            pasteSnippet("comment")
        },
        forloop: function(){
            pasteSnippet("forloop")
        },
        ifstring: function(){
            pasteSnippet("ifstring")
        },
		c: function() {
			openLinkInNewTab(configLink);
		},
		e: function() {
			openLinkInNewTab(eventLink);
		},
		f: function() {
			openLinkInNewTab(filesLink);
		}
	};

	document.addEventListener('keydown', function(e) {
		if (e.ctrlKey && e.code === 'KeyP') {
			const userInput = prompt("Command Palette for Automation Anywhere:\n Enter a command or 'help'", "");
			const command = commands[userInput];
			if (command) {
				command();
			} else {
				showHelp();
			}
			e.preventDefault(); // This will prevent the default action for the Ctrl+P key combination
		}
	});


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




	// Toggle sidebar
	document.addEventListener('keydown', function(e) {
		if (e.ctrlKey && e.code === 'KeyD') {
			(function() {
				document.querySelector("div.editor-layout__resize:nth-child(2) > button:nth-child(2)").click();
			})();
			e.preventDefault();
		}
	});

	function addAction() {
		try {
			document.querySelector("div.editor-palette__accordion:nth-child(2) > div:nth-child(1) > header:nth-child(1) > div:nth-child(1) > button:nth-child(1) > div:nth-child(1) > div:nth-child(2)").click();
		} catch {}
		try {
			document.querySelector('.editor-palette-search__cancel button[type="button"][tabindex="-1"]').click();
		} catch {}
	}

	function addVariable() {
		try {
			const accordion = document.querySelector("div.editor-palette__accordion:nth-child(1)");
			const addButton = accordion.querySelector("header:nth-child(1) button:nth-child(1)");
			addButton.click();
		} catch (error) {}

		try {
			const cancelButton = document.querySelector('div.editor-palette-search__cancel button');
			cancelButton.click();
		} catch (error) {}

		try {
			const createButton = document.querySelector('button[name="create"]');
			createButton.click();
		} catch (error) {}

		try {
			const confirmButton = document.querySelector("div.action-bar--theme_default:nth-child(1) > button:nth-child(2)");
			confirmButton.click();
		} catch (error) {}
	}

	function showVariables() {
		document.querySelector('span.clipped-text.clipped-text--no_wrap.editor-palette-section__header-title[title="Variables"]')?.click();
	}

	function deleteUnusedVariables() {
		const accordion = document.querySelector("div.editor-palette__accordion:nth-child(1)");
		const addButton = accordion.querySelector("header:nth-child(1) button:nth-child(1)");
		addButton.click();
		const menuButton = document.querySelector("button.action-bar__item--is_menu:nth-child(5)");
		menuButton.click();
		const deleteButton = document.querySelector("button.rio-focus--inset_4px:nth-child(2)");
		deleteButton.click();
	}

	function hideDialog() {
		var dialogElement = document.querySelector('[role="dialog"]');
		if (dialogElement) {
			dialogElement.parentNode.removeChild(dialogElement);
		} else {
			console.error('No element found with role="dialog"');
		}

		var backdropElement = document.querySelector(".jsx-3772251890.modal__backdrop");
		if (backdropElement) {
			backdropElement.parentNode.removeChild(backdropElement);
		} else {
			console.error('No element backdrop found');
		}

		backdropElement = document.querySelector(".modal__backdrop");
		if (backdropElement) {
			backdropElement.parentNode.removeChild(backdropElement);
		} else {
			console.error('No element backdrop found');
		}
	}

	function openLinkInNewTab(url) {
		var newWindow = window.open(url, '_blank');
		if (newWindow) {
			newWindow.blur();
			window.focus();
		} else {
			alert('Pop-up blocked. Please allow pop-ups for this website.');
		}
	}

	function foldAll() {
		const folderClicks = document.querySelectorAll(".taskbot-canvas-list-node__collapser");
		Array.from(folderClicks).reverse().forEach(element => element.click());
	}

	function showHelp() {
		alert("List of commands:\n" +
			"a: Add Action\n" +
			"adv: Add Variable\n" +
			"v: Show Variables\n" +
			"duv: Delete Unused Variables\n" +
			"hd: Hide dialog when running bot\n" +
			"c: Open config file\n" +
			"up: Update packages\n" +
			"fa: Expand/Collapse All Folders\n" +
			"e: Open event file");
	}

	//============ Command palette stuff END ============
	//============ updatePackages stuff START ============
	function updatePackages() {
		document.querySelector(".rio-icon--icon_three-vertical-dots-meatball-menu").click();

		function clickSpanWithText(text) {
			var spans = document.querySelectorAll('span.clipped-text.clipped-text--no_wrap.dropdown-option-label span.clipped-text__string');
			for (var i = 0; i < spans.length; i++) {
				if (spans[i].textContent.toLowerCase().includes(text.toLowerCase())) {
					spans[i].click();
					break;
				}
			}
		}

		// Call the function with "package"
		clickSpanWithText("packages");

		document.querySelectorAll('.package-resource__title[title*="not default"]')
			.forEach(span => {
				// Simulate a click on the span
				span.click();

				// Wait for the DOM changes to occur after the click, then perform further actions
				setTimeout(() => {
					let versionCell = span.querySelector('.taskbot-edit-page__package__versions__cell.taskbot-edit-page__package__versions__cell--select');
					if (versionCell) {
						versionCell.click();

						// Wait for the dropdown to appear, then perform further actions
						setTimeout(() => {
							let option = versionCell.querySelector('.choice-input-dropdown__options .choice-input-dropdown__option[role="option"]');
							if (option) {
								option.click();
							}
						}, 5000); // Adjust the timeout as needed
					}
				}, 3000); // Adjust the timeout as needed
			});
	}
	//============ updatePackages stuff END ============
	//============ Feat snippets START ============
    function generateEmojiString() {
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];
        let uniqueString = '';

        for (let i = 0; i < 10; i++) {
            uniqueString += emojis[Math.floor(Math.random() * emojis.length)];
        }

        return uniqueString;
    }

	function pasteSnippet(key) {
        //document.querySelector("button[name='shared-clipboard-copy']").click();
        let emojiUid = generateEmojiString();

		const node = snippetJson.snippet.find(item => item.nodeName === key);
		if (node) {
			let data = node.data;

			data = data.replace(/'/g, '"');
			data = data.replace(/🔥🔥🔥/g, emojiUid);


			localStorage.setItem("globalClipboard", data);
			localStorage.setItem("globalClipboardUid", `"${emojiUid}"`);
            console.log({data});
		} else {
			console.log(`Node with nodeName ${key} not found.`);
		}

        setTimeout(() => {
            document.querySelector("button[name='shared-clipboard-paste']").click();
        }, 1200);
	}

	//============ Feat snippets END ============
	//============ Custom buttons stuff Start ============
	/*   let attemptCount = 0;
	   const buttonLinks = {
	       'Config': {
	           url: configLink,
	           icon: 'icon aa-icon aa-icon-pathfinder-administration icon--block 69696969'
	       },
	       'Events': {
	           url: eventLink,
	           icon: 'icon aa-icon aa-icon-pathfinder-administration icon--block'
	       },
	       'Files': {
	           url: filesLink,
	           icon: 'rio-icon rio-icon--icon_folder resource__icon__icon icon--block'
	       }
	   };

	   function createSeparator() {
	       const separator = document.createElement('div');
	       separator.className = 'editor-page-header__separator';
	       separator.setAttribute('aria-hidden', 'true');
	       return separator;
	   }

	   function createButton(name, {
	       url,
	       icon
	   }) {
	       const divContainer = document.createElement('div');
	       divContainer.className = 'icon-button g-box-sizing_border-box';

	       const button = document.createElement('button');
	       button.name = name.toLowerCase();
	       button.type = 'button';
	       button.tabIndex = 0;
	       button.className = 'rio-focus rio-focus--inset_0 rio-focus--border-radius_4px rio-focus--has_element-focus-visible rio-bare-button g-reset-element g-no-out-transitions rio-bare-button--rio_interactive-whisper rio-bare-button--is_parent rio-bare-button--is_clickable rio-bare-button--size_14px rio-bare-button--padding-for-size_14px icon-button__button g-reset-element';
	       button.innerHTML = `
	           <div class="icon-button-icon">
	               <span class="${icon}"></span>
	               <span class="_69"></span>
	           </div>
	           <span class="clipped-text clipped-text--no_wrap icon-button__button-label" title="${name}">
	               <span class="clipped-text__string clipped-text__string--for_presentation">${name}</span>
	               <span aria-hidden="true" class="clipped-text__string clipped-text__string--for_reference">${name}</span>
	           </span>
	       `;

	       divContainer.appendChild(button);

	       // Add event listener to open the link in a new tab
	       button.addEventListener('mouseup', function(event) {
	           if (event.button === 1) { // Middle mouse button
	               window.open(url, '_blank');
	           }
	       });

	       // Keep the existing click event listener for left-click behavior
	       button.addEventListener('click', function(event) {
	           if (event.button === 0 && !event.ctrlKey) { // Left-click without Ctrl
	               window.location.href = url;
	           }
	       });

	       return divContainer;
	   }

	   function insertConfigButton() {
	       const targetElement = document.querySelector('.editor-page-header__controls');

	       if (!checkSpanClass()) return;

	       if (targetElement) {
	           // Append only one separator at the beginning
	           targetElement.appendChild(createSeparator());

	           // Create and append each button
	           for (const [name, data] of Object.entries(buttonLinks)) {
	               targetElement.appendChild(createButton(name, data));
	           }
	       } else {
	           console.log('Target element not found. Attempt ' + (attemptCount + 1));
	           if (attemptCount < 25) {
	               attemptCount++;
	               setTimeout(insertConfigButton, 3000);
	           }
	       }
	   }

	   function checkSpanClass() {
	       // Query for span elements with class '69'
	       const spanWithClass69 = document.querySelector('span._69');
	       return !spanWithClass69;
	   }

	   document.addEventListener('DOMContentLoaded', function() {
	       insertConfigButton();
	   });

	   let lastHref = document.location.href;

	   setInterval(function() {
	       const currentHref = document.location.href;

	       if (lastHref !== currentHref) {
	           lastHref = currentHref;
	           insertConfigButton(); // Call your function when the URL changes
	       }
	   }, 5000);*/

})();
