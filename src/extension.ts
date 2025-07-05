import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

// Command IDs
const updateCommandId = 'vscode-weather-status-open-meteo.update';
const setLocationCommandId = 'vscode-weather-status-open-meteo.set-location';

// Empty string here means don't pass anything to API call
const temperatureUnitMap: Record<string,string> = {
	"Celsius": "",
	"Fahrenheit" : "fahrenheit"
};

// Empty string here means don't pass anything to API call
const windSpeedUnitMap: Record<string,string> = {
	"Km/h": "",
	"m/s": "ms",
	"Mph": "mph",
	"Knots" : "kn"
};

// Map of WMO code to short textual descriptions from https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c
const wmoCodeMap: Record<number, [string, string]> = {
    0: ["Clear", "Sunny"],
    1: ["Mainly Clear", "Mainly Sunny"],
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
	// Register the commands so that they accessible from the command palette
	let updateCommand = vscode.commands.registerCommand(updateCommandId, () => {
		updateWeatherStatus();
	});
	context.subscriptions.push(updateCommand);

	let setLocationCommand = vscode.commands.registerCommand(setLocationCommandId, () => {
		setLocationConfiguration();
	});
	context.subscriptions.push(setLocationCommand);

	// Create the status bar area we will use and associate our update command with it so that 
	// clicking the item in the status bar will cause an update
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = updateCommandId;
	context.subscriptions.push(statusBarItem);

	// Update the weather status on activating the extension
	vscode.commands.executeCommand(updateCommandId);

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

async function setLocationConfiguration() {
	let options: vscode.InputBoxOptions = {
		prompt: "Enter your location as latitude,longitude e.g. 34.567,-0.123",
		placeHolder: "0,0"
	};
	
	vscode.window.showInputBox(options).then(value => {
		if (!value) {
			console.log("No value entered");
			return;
		}
		
		// Expecting two numbers in the form "33.333,-3.333" which we will split into latitude and longitude
		console.log(`Value entered: ${value}`);

		let parts = value.split(",");
		if( parts.length === 2 ) {
			const latitude = parseFloat(parts[0].trim());
			const longitude = parseFloat(parts[1].trim());

			// NaN means that one of these is not a valid number
			if( Number.isNaN(latitude) || Number.isNaN(longitude) ) {
				vscode.window.showErrorMessage('Invalid value entered. Settings not changed');
				return;
			}

			// 0,0 is not a land location and we use it to signify "no value entered"
			if( latitude === 0 && longitude === 0 ) {
				vscode.window.showErrorMessage('Unexpected values entered. Settings not changed');
				return;
			}
			
			// Update the two settings and when that's done, invoke the update command
			const configuration = vscode.workspace.getConfiguration("vscode-weather-status-open-meteo");
			configuration.update("latitude", latitude, vscode.ConfigurationTarget.Global).then( _ => {
				configuration.update("longitude", longitude, vscode.ConfigurationTarget.Global ).then( _ => {
					// Got the values we need. Now we can force an update
					statusBarItem.command = updateCommandId;
					vscode.commands.executeCommand(updateCommandId);
				});
			});
		} else {
			vscode.window.showErrorMessage('Expecting two values, latitude and longitude, separated by a comma');
		}
	});
}

async function updateWeatherStatus() {
	const configuration = vscode.workspace.getConfiguration("vscode-weather-status-open-meteo");
	
	// Build the URL
	const baseUrl = 'https://api.open-meteo.com/v1/forecast';

	const latitude = configuration.get("latitude");
	const longitude = configuration.get("longitude");

	// Try and determine whether we have a useful configuration
	if( latitude === '0' && longitude === '0' ) {
		// Treat this as an informational message, not an error
		console.info( "Weather Status needs location information to continue");
		if( configuration.get("infoNotifications")) {
			vscode.window.showInformationMessage('Weather Status requires configuration');
		}

		statusBarItem.text = `Weather Status: Click to configure`;
		statusBarItem.tooltip = `Weather Status: Configuration required`;
		statusBarItem.command = setLocationCommandId;
	} else {
		// Ready to query for the weather details
		if( configuration.get("infoNotifications")) {
			vscode.window.showInformationMessage('Updating weather status');
		}
	
		const params = new URLSearchParams({
			latitude: String(latitude),
			longitude: String(longitude),
			timeformat: "unixtime"
		});
		
		// Get the programmatic value for temperature units that corresponds to the human-readable string
		// we use in settings.
		// Add it as a param if there is a value (e.g. no value required if using the default)
		const temperatureUnitSetting = String(configuration.get("temperatureUnit"));
		const temperatureUnitParam = temperatureUnitMap[temperatureUnitSetting];
		if( temperatureUnitParam !== "") {
			params.append("temperature_unit", temperatureUnitParam);
		}
	
		// Get the programmatic value for wind speed units that corresponds to the human-readable string
		// we use in settings.
		// Add it as a param if there is a value (e.g. no value required if using the default)
		const windSpeedUnitSetting = String(configuration.get("windSpeedUnit"));
		const windSpeedUnitParam = windSpeedUnitMap[windSpeedUnitSetting];
		if( windSpeedUnitParam !== "") {
			params.append("wind_speed_unit", windSpeedUnitParam);
		}

		// TODO Settings:
		// - whether to label display items
		// - prompt the user if location unset
	
		// Request all of these items from the weather service
		// We assemble the URL in this fashion as the commas in this 'request' get encoded if
		// we try and use the URLSearchParams structure to inject them into the URL 
		const request = "is_day,temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,weather_code";
		let urlWithParams = `${baseUrl}?${params.toString()}&current=${request}`;
	
		try {
			const response = await fetch(urlWithParams);
			
			if (response.ok) {
				// These interfaces describe only the return values we are interested in, not the full API.
				interface OpenMeteoCurrentUnits {
					relative_humidity_2m: string, 
					temperature_2m: string, 
					wind_speed_10m: string, 
				}
				interface OpenMeteoCurrent {
					is_day: number,	// boolean as 0 or 1
					relative_humidity_2m: number, 
					time: number, 
					temperature_2m: number, 
					weather_code: number,
					wind_speed_10m: number, 
					wind_direction_10m: number, 
				}
				interface OpenMeteoResponse {
					current: OpenMeteoCurrent  
					current_units: OpenMeteoCurrentUnits,
					utc_offset_seconds: number  
				}

				// OK, we've received all the data, now split it out and format the values for display
				const data = await response.json() as OpenMeteoResponse;
	
				const temperature = data.current.temperature_2m;
				const temperature_unit = data.current_units.temperature_2m;
	
				const wind_speed_10m = data.current.wind_speed_10m;
				const wind_speed_unit = data.current_units.wind_speed_10m;
				const wind_direction_10m = data.current.wind_direction_10m;
	
				// This value is unixtime in seconds and so needs multiplying by 1000 if used in a Date()
				const updateTime = data.current.time + data.utc_offset_seconds;
	
				// Check the settings to find out which of these items go into the displayed weather status value
				// Initialize an empty string array, add items to the array based on settings and then form the array into a display string
				let weatherItemsArray: string[] = [];

				// Show the weather code as a string value ("cloudy", "rainy", ...) if we have an appropriate value for it
				if (configuration.get("showWeatherCode")) {
					if (data.current.weather_code in wmoCodeMap) {
						// Use the returned 'is_day' variable to display weather in context - e.g. "sunny" in daytime is "clear" at night
						weatherItemsArray.push( `${wmoCodeMap[data.current.weather_code][data.current.is_day]}` );
					}
				}
	
				if (configuration.get("showTemperature")) {
					weatherItemsArray.push( `${temperature}${temperature_unit}` );
				}
	
				if (configuration.get("showWindSpeed")) {
					weatherItemsArray.push( `${wind_speed_10m}${wind_speed_unit} ${degreesToCompassPoint(wind_direction_10m)}`);
				}
	
				if (configuration.get("showRelativeHumidity")) {
					weatherItemsArray.push( `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`);
				}

				// Join the array elements into a single string with spaces between items
				const weatherString = weatherItemsArray.join(" ");
	
				// Update the text and tooltip.
				statusBarItem.text = `${weatherString}`;
				statusBarItem.tooltip = `Weather: ${weatherString}.\nLast updated ${new Date(updateTime*1000)}`;
			} else {
				throw new Error(`${response.status} ${response.statusText}`);
			}
		} catch( error ) {
			console.error(`Failed to update weather status: ${String(error)}`);
			if( configuration.get("errorNotifications")) {
				vscode.window.showErrorMessage(`Failed to update weather status: ${String(error)}`);
			}
	
			statusBarItem.text = "Weather n/a";
			statusBarItem.tooltip = `Failed to update weather status: ${String(error)}.\nClick to retry.`;
		}
	}

	// Make sure the status bar item is visible
	statusBarItem.show();
}

function degreesToCompassPoint(degrees: number): string {
	// Normalize the degrees to be between 0 and 360
	const normalizedDegrees = (degrees + 360) % 360;
  
	// Define the compass points
	const compassPoints = [
	  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
	  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
	];
  
	// Calculate the index of the compass point
	const index = Math.round(normalizedDegrees / 22.5) % 16;
  
	// Return the corresponding compass point
	return compassPoints[index];
  }