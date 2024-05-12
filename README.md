# Better AutomationAnywhere

<div align="center">
<img src="https://i.ibb.co/pK7C9N2/aa-preview.png" alt="aa-preview" border="0">
</div>

#### Working on AutomationAnywhere Control Room 31.0.0 and 32.0.0
Improvements to enhance the Automation Anywhere development platform include an upgraded user interface and a suite of features accessible via a command palette, along with fixes for several annoyances.

## Features

### aa.user.styl
<img src="https://i.ibb.co/W2bxLKX/image.png" alt="image" border="0" width="50%">
<br>
- Converts input fields that have a horizontal scroll into text areas that break words, allowing you to view all contents at a glance.
<img src="https://i.ibb.co/fx0RDqk/input-to-areatext.png" alt="input-to-areatext" border="0" width="60%">
- Redesigned the annoying buttons for selecting actions, variables, and triggers.
<img src="https://i.ibb.co/tHhMdWs/services.png" alt="services" border="0" width="60%">

- Increases the font size and assigns Cascadia Code and Cursive Cascadia Code to key parts of the UI.
- Adds a colorful background.
- And much more...

### userScript.js
https://github.com/Jamir-boop/automationanywhere-improvements/assets/73477811/f7c6eec2-409f-495d-88e3-028e5b6d4593

The script adds a command palette to Automation Anywhere, which can be invoked using the `Alt + P` key combination. The command palette provides a set of commands that can be used to perform various actions on the Automation Anywhere platform. The commands include:

- `a`, `addaction`, `add action`, `action`: Opens and focuses the actions input field.
- `adv`, `addvar`, `add variable`: Adds a new variable.
- `v`, `showvars`, `list variables`, `variables`: Shows all variables.
- `duv`, `delete unused`, `remove unused variables`: Deletes unused variables.
- `hd`, `hide dialog`, `close dialog`: Hides the dialog that appears when a bot is running.
- `up`, `updatepkgs`, `upgrade packages`: Updates all packages.
- `fa`, `fold all`, `collapse all`: Folds all sections in the code.
- `p`, `private`, `private bots`: Redirects to the private bots folder.
- `help`, `h`, `show help`: Displays help information for available commands.

If an invalid command is entered, a help message is displayed with a list of valid commands.

## Why are there two separate files with different extensions?

I'm aware that the presence of two files across different formats may seem unnecessary and potentially confusing.

This decision was made considering the fact that there's no need to reinvent the wheel by creating a way to ship the entire `aa.user.styl` file, which was written in Stylus syntax. Both Stylus and Tampermonkey frameworks are proficient in simplifying the development work, expediting the process. Please note that I'm open to options that can streamline the installation process.

## Installation
These are a userScript (`userScript.js`) and a userStyle (`aa.user.styl`), designed to function either together or independently. The `userScript.js` operates within the Tampermonkey extension, whereas the `aa.user.styl` is executed through the Stylus extension.

### Considerations
- Ensure the control room is set to English to maintain the correct functionality of script selectors.
- Optionally, consider installing the [Casacadia Code](https://github.com/microsoft/cascadia-code) font on your system.

Before starting if you only want the

1. Install the [Tampermonkey extension](https://www.tampermonkey.net) on your browser.
2. Click on the Tampermonkey icon and select "Create a new script".
3. Copy and paste the provided script into the editor.
4. Save the script.

## Usage

1. Navigate to the Automation Anywhere platform.
2. Press `Alt + P` to invoke the command palette.
3. Enter a command or `help` for a list of commands.
4. Press `Enter` to execute the command.

## License

This project is licensed under the MIT License.

## Author

This script was created by jamir-boop.
