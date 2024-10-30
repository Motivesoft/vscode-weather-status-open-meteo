# vscode-weather-status-open-meteo

Display current weather information on the status bar, using the excellent free weather service [Open-Meteo](https://open-meteo.com/).

> Note: This extension is designed as an alternative to [vscode-weather-status](https://github.com/Motivesoft/vscode-weather-status), which uses a different weather service but otherwise offers similar features.

> Note: To use this extension, it will be necessary to determine and configure the latitude and longitude of the location you want the weather for. This can be determined in various way, for example by using an map web application such as Google Maps.  

## Usage

The extension will automatically start and, if configured with a latitude and longitude to use as a location, will get the current weather for that location and display it in the status bar.

The weather will automatically update every hour and an update can be forced by clicking on the status bar weather display.

Settings can be used to control the displayed weather items and the units used for the display. See [Extension Settings](#extension-settings) for configuration details.

> Note: When the extension first activates, it will offer the user the chance to configure the location to use. The latitude and longitude can be set in the Settings, or by using the `Set Weather Location` command.

## Features

* Displays current weather conditions in the status bar, updated hourly
* Configurable display of conditions, temperature, wind speed and direction, and relative humidity
* Configurable units for display (e.g. Celsius or Fahrenheit)

## Requirements

The extension is heavily dependent on the availability and functionality of the Open-Meteo service.

## Extension Settings

| Name | Description | Default Value |
|------|-------------|---------------|
| vscode-weather-status-open-meteo.latitude | Latitude of the location to use in the request for weather conditions. | 0 |
| vscode-weather-status-open-meteo.longitude | Longitude of the location to use in the request for weather conditions. | 0 |
| vscode-weather-status-open-meteo.showWeatherCode | Show a short textual description of the weather along with the numeric details. | true |
| vscode-weather-status-open-meteo.showTemperature | Show the current temperature. | true |
| vscode-weather-status-open-meteo.showWindSpeed | Show the current wind speed and direction. | true |
| vscode-weather-status-open-meteo.showRelativeHumidity | Show the current relative humidity. | true |
| vscode-weather-status-open-meteo.infoNotifications | Show a notification when updating weather settings. | true |
| vscode-weather-status-open-meteo.errorNotifications | Show a notification if there is a problem updating weather settings. | true |
| vscode-weather-status-open-meteo.temperatureUnit | Choose the unit of measurement to use for temperatures | Celsius |
| vscode-weather-status-open-meteo.windSpeedUnit | Choose the unit of measurement to use for wind speed | Km/h |

> Note: For the `temperatureUnit` and `windSpeedUnit` properties, the default values are shown, but they also have enumerated options which are not included in this table format. The `temperatureUnit` can be either "Celsius" or "Fahrenheit", while the `windSpeedUnit` can be "Km/h", "m/s", "Mph", or "Knots".

> Note: Unless the latitide and longitude are configured, the extension will not display any weather information.

> Note: There is a command called `Set Weather Location` that can be run from the command palette that allows configuring the latitude and longitude in a single operation.

## Known Issues

The extension expects the user to understand that they need to go and configure their location before the extension will display any weather details. When these values are not yet configured, clicking on the status bar area for the extension will allow the user to type in the values required. This can also be done by running the `Set Weather Location` command or editing the extension's settings. 

The extension is totally reliant on the Open-Meteo weather service for its functionality.

## Release Notes

### 1.0.0

Initial release