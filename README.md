# Weather Status using Open-Meteo

Display current weather information on the status bar using the free weather API and service from [Open-Meteo](https://open-meteo.com/).

> Note: This extension is designed as an alternative to [vscode-weather-status](https://github.com/Motivesoft/vscode-weather-status), which uses a different weather service but otherwise offers similar features.

> Note: To use this extension, it will be necessary to determine and configure the latitude and longitude of the location you want the weather for. This can be determined in various way, for example by using an map web application such as Google Maps.

> Note: For clarity, this extension is not affiliated with Open-Meteo. It simply uses their API for weather data.

## Usage

The extension will automatically start and, if configured with a latitude and longitude, will get the current weather for that location and display it in the status bar.

The weather will automatically update every hour and an update can be forced by clicking on the status bar weather display or by running the `Update Weather Status` command from the command palette.

Settings can be used to control the display of weather details and the units used. See [Extension Settings](#extension-settings) for configuration details.

> Note: When the extension first activates, it will offer the user the chance to configure the location to use by clicking the status bar area used by the extension. Alternatively, the latitude and longitude can be set in the Settings, or by using the `Set Weather Location` command.

## Features

* Displays current weather conditions in the status bar, updated hourly
* Configurable display of conditions, temperature, wind speed and direction, and relative humidity
* Configurable units for display (e.g. Celsius or Fahrenheit)

## Requirements

The extension is dependent on the availability and functionality of the [Open-Meteo weather forecast APi](https://open-meteo.com/en/docs).

## Extension Settings

The following settings can be used to control the behaviour and display of the weather status information.

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

> Note: Unless the latitide and longitude are configured, the extension will not be able to obtain or display any weather information.

> Note: There is a command called `Set Weather Location` that can be run from the command palette that allows configuring the latitude and longitude in a single operation.

## Known Issues

The extension requires the user to configure their location into Settings before any weather details can be displayed. If these are not configured, clicking on the status bar area for the extension will prompt the user to type in the details required. This can also be done by running the `Set Weather Location` command.

The extension is reliant on the Open-Meteo weather service for its functionality.

## Release Notes

### 1.0.5

- Updated dependencies in response to [CVE-2025-25200](https://github.com/advisories/GHSA-593f-38f6-jp5m)
- Removed debug console log message

### 1.0.2

- Minor documentation updates for clarity

### 1.0.1

- Improve messaging on first use

### 1.0.0

- Initial release
