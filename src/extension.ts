// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

const temperatureUnitMap: Record<string,string> = {
	"Celsius": "",
	"Fahrenheit" : "fahrenheit"
};

const windSpeedUnitMap: Record<string,string> = {
	"Km/h": "",
	"m/s": "ms",
	"Mph": "mph",
	"Knots" : "kn"
};

// Map of WMO code to short textual descriptions from https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c
const wmoCodeMap: Record<number, [string, string]> = {
    0: ["Sunny", "Clear"],
    1: ["Mainly Sunny", "Mainly Clear"],
    2: ["Partly Cloudy", "Partly Cloudy"],
    3: ["Cloudy", "Cloudy"],
    45: ["Foggy", "Foggy"],
    48: ["Rime Fog", "Rime Fog"],
    51: ["Light Drizzle", "Light Drizzle"],
    53: ["Drizzle", "Drizzle"],
    55: ["Heavy Drizzle", "Heavy Drizzle"],
    56: ["Light Freezing Drizzle", "Light Freezing Drizzle"],
    57: ["Freezing Drizzle", "Freezing Drizzle"],
    61: ["Light Rain", "Light Rain"],
    63: ["Rain", "Rain"],
    65: ["Heavy Rain", "Heavy Rain"],
    66: ["Light Freezing Rain", "Light Freezing Rain"],
    67: ["Freezing Rain", "Freezing Rain"],
    71: ["Light Snow", "Light Snow"],
    73: ["Snow", "Snow"],
    75: ["Heavy Snow", "Heavy Snow"],
    77: ["Snow Grains", "Snow Grains"],
    80: ["Light Showers", "Light Showers"],
    81: ["Showers", "Showers"],
    82: ["Heavy Showers", "Heavy Showers"],
    85: ["Light Snow Showers", "Light Snow Showers"],
    86: ["Snow Showers", "Snow Showers"],
    95: ["Thunderstorm", "Thunderstorm"],
    96: ["Light Thunderstorms With Hail", "Light Thunderstorms With Hail"],
    99: ["Thunderstorm With Hail", "Thunderstorm With Hail"]
};

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "vscode-weather-status-open-meteo" is now active');

	// Our update command
	const commandId = 'vscode-weather-status-open-meteo.update';

	// Register it so it is accessible from the command palette
	let command = vscode.commands.registerCommand(commandId, () => {
		updateWeatherStatus();
	});
	context.subscriptions.push(command);

	// Create the status bar area we will use and associate our update command with it so that 
	// clicking the item in the status bar will cause an update
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = commandId;
	context.subscriptions.push(statusBarItem);

	// Update the weather status on activating the extension
	vscode.commands.executeCommand(commandId);

	// Cause an update on a regular basis - every 60 minutes
	// TODO: consider making this configurable, but not too much
	setInterval(updateWeatherStatus, 60 * 60 * 1000);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Tear down the status bar item
	if(statusBarItem) {
		statusBarItem.hide();
		statusBarItem.dispose();
	}
}

async function updateWeatherStatus() {
	const configuration = vscode.workspace.getConfiguration("vscode-weather-status-open-meteo");

	if( configuration.get("notifications-info")) {
		vscode.window.showInformationMessage('Updating weather status');
	}

	// Build the URL
	const baseUrl = 'https://api.open-meteo.com/v1/forecast';

	const latitude = configuration.get("latitude");
	const longitude = configuration.get("longitude");

	// Try and determine whether we have a useful configuration
	if( latitude === '0' || longitude === '0') {
		// Treat this as an informational message, not an error
		console.info( "Cannot obtain weather status: Missing latitude/longitude");
		if( configuration.get("notifications-info")) {
			vscode.window.showInformationMessage('Cannot obtain weather status: Missing latitude/longitude');
		}

		statusBarItem.text = `Weather Status`;
		statusBarItem.tooltip = `Weather Status: configuration required`;
	} else {
		// Ready to go
		const params = new URLSearchParams({
			latitude: String(latitude),
			longitude: String(longitude),
			timeformat: "unixtime"
		});
		
		// Get the programmatic value for temperature units that corresponds to the human-readable setting
		// Add it as a param if there is a value (e.g. no value required if using the default)
		const temperatureUnitSetting = String(configuration.get("temperature_unit"));
		const temperatureUnitParam = temperatureUnitMap[temperatureUnitSetting];
		if( temperatureUnitParam !== "") {
			params.append("temperature_unit", temperatureUnitParam);
		}
	
		// Get the programmatic value for wind speed units that corresponds to the human-readable setting
		// Add it as a param if there is a value (e.g. no value required if using the default)
		const windSpeedUnitSetting = String(configuration.get("wind_speed_unit"));
		const windSpeedUnitParam = windSpeedUnitMap[windSpeedUnitSetting];
		if( windSpeedUnitParam !== "") {
			params.append("wind_speed_unit", windSpeedUnitParam);
		}

		// TODO Settings:
		// - whether to label display items
		// - prompt the user if location unset
	
		const request = "is_day,temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,weather_code";
		let urlWithParams = `${baseUrl}?${params.toString()}&current=${request}`;
	
		try {
			console.log(`Issuing call: ${urlWithParams}`);
			const response = await fetch(urlWithParams);
			
			if (response.ok) {
				const data = await response.json();
	
				const temperature = data.current.temperature_2m;
				const temperature_unit = data.current_units.temperature_2m;
	
				const wind_speed_10m = data.current.wind_speed_10m;
				const wind_speed_unit = data.current_units.wind_speed_10m;
	
				const updateTime = data.current.time + data.utc_offset_seconds;
	
				// Format the details
				let weatherString = `${temperature}${temperature_unit} ${wind_speed_10m}${wind_speed_unit} ${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`;
	
				// If requested, and we can work one out, add a simple descriptive bit of text to describe the current conditions
				if (configuration.get("show-weather-code")) {
					if (data.current.weather_code in wmoCodeMap) {
						const wmoText = `${wmoCodeMap[data.current.weather_code][data.current.is_day]} `;
						weatherString = `${wmoText}. ` + weatherString;
					}
				}
	
				statusBarItem.text = `${weatherString}`;
				statusBarItem.tooltip = `Weather: ${weatherString} updated ${updateTime} ${new Date(updateTime*1000)}`;
			} else {
				throw new Error(`${response.status} ${response.statusText}`);
			}
		} catch( error ) {
			console.error(`Failed to update weather status: ${String(error)}`);
			if( configuration.get("notifications-error")) {
				vscode.window.showErrorMessage(`Failed to update weather status: ${String(error)}`);
			}
	
			statusBarItem.text = "Weather n/a";
			statusBarItem.tooltip = `Failed to update weather status: ${String(error)}. Click to retry.`;
		}
	}

	// Make sure the status bar item is visible
	statusBarItem.show();
}
