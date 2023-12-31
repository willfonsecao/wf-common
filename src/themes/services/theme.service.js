import { purple } from '../themes-files';
import { darkMode } from '../themes-files';
import AvaiableThemesUtil from '../utils/avaiable-themes.util';
const { generateAccentPalette } = require('materialifier');

/**
 * A service class for managing themes.
 * @class
 */
class ThemeService {

    /**
    * Creates an instance of ThemeService.
    * @constructor
    * @param {Object=} config - Optional settings for the ThemeService class.
    * @param {boolean=} config.replaceDefaultThemes - Indicates whether default themes should be replaced.
    * @param {Theme|Theme[]=} config.themes - Theme or array of themes to be added.
    * @param {string=} config.activeThemeName - Name of the active theme.
    * @param {Zoom=} config.zoom - Zoom settings.
    */
    constructor(config) {
        this.activeTheme;
        this.zoom = 1;
        this.maxZoomSize = 99999999;
        this.minZoomSize = -99999999;
        this.previousActiveTheme;
        this.availableThemes = AvaiableThemesUtil.getAvaiableThemes();
        this.isDarkModeEnabled = false;

        this.buildFromCustomConfig(config);
    }
    /**
     * Adds a new theme to the list of available themes.
     * @param {{
     * name: string,
     * properties: [Partial(Property)]
     * }} theme - The theme object to be added.
     */
    addTheme(theme) {
        this.availableThemes.push(theme);
    }

    /**
     * Gets the list of available themes.
     * @returns {array} The list of available themes.
     */
    getAvailableThemes() {
        return this.availableThemes;
    }

    /**
    * Gets the active theme.
    * @returns {{
     * name: string,
     * properties: [Partial(Property)]
    * }} The active theme.
    */
    getActiveTheme() {
        return this.activeTheme;
    }

    /**
     * Gets a property scale from a theme.
     * @param {string} themeName - The name of the theme.
     * @param {string} propertyName - The name of the property.
     * @returns {object} The property scale.
     */
    getPropertyScale(themeName, propertyName) {
        return this.getThemeByName(themeName)?.properties.find(prop => prop.name === propertyName);
    }

    /**
     * Gets the active theme's color scale for a specific variable.
     * @param {string} variableName - The name of the variable.
     * @param {number | string} scale - The scale of the color.
     * @returns {string} The color value from the active theme's scale.
     */
    getActiveThemeColorScale(variableName, scale) {
        return this.getColor(this.activeTheme.name, variableName, scale);
    }

    /**
     * Gets the color value from a specific theme's scale.
     * @param {string} themeName - The name of the theme.
     * @param {string} variableName - The name of the variable.
     * @param {number | string} scale - The scale of the color.
     * @returns {string|undefined} The color value from the theme's scale, or undefined if not found.
     */
    getColor(themeName, variableName, scale) {
        const theme = this.availableThemes.find(th => th.name === themeName);
        if (theme) {
            const property = theme.properties.find(pro => pro.name === variableName);
            if (property) {
                return property[scale];
            }
            console.error(`Cannot find any variable called ${variableName} in the ${themeName} theme`);
            return undefined;
        }
        console.error(`Cannot find any theme called ${themeName}`);
        return undefined;
    }

    toggleDarkMode() {
        if (this.isDarkModeEnabled) {
            this.setActiveTheme(this.previousActiveTheme);
            this.activeTheme = this.previousActiveTheme;
        } else {
            this.addPrimaryColorOnDarkMode();
            this.setActiveTheme(darkMode);
            this.activeTheme = darkMode;
        }
        this.isDarkModeEnabled = !this.isDarkModeEnabled;
    }

    activateTheme(themeName) {
        const theme = this.availableThemes.find(t => t.name === themeName);
        if (theme) {
            this.previousActiveTheme = this.activeTheme;
            this.setActiveTheme(theme);
        } else {
            console.error(`There isn't any ${themeName} theme in available themes`);
        }
    }

    increaseZoom() {
        const value = this.getIncreasedZoom();
        this.zoom = this.adjustZoomToLimits(value);
        this.changeZoomHtmlVariable();
    }

    decreaseZoom() {
        const value = this.getDecreasedZoom();
        this.zoom = this.adjustZoomToLimits(value);
        this.changeZoomHtmlVariable();
    }

    resetZoom() {
        this.zoom = 0;
        this.changeZoomHtmlVariable();
    }

    generateScale(color, propertyName, replaceOnActiveTheme = false) {
        const colors = generateAccentPalette(color.toLowerCase());
        const palette = this.convertToPalette(colors);
        const defaultScale = this.getDefaultScale(color.toLowerCase(), palette);
        const property = this.createPropertie(propertyName, defaultScale, palette);
        this.setColorsToWindow(property);
        this.replacePropertyOnActiveTheme(property, replaceOnActiveTheme);
    }

    addPrimaryColorOnDarkMode() {
        const primary = this.getPropertyScale(this.previousActiveTheme.name, 'primary');
        if (primary) {
            darkMode.properties.push(primary);
        }
    }

    replacePropertyOnActiveTheme(property, replaceOnActiveTheme) {
        if (replaceOnActiveTheme) {
            const filteredProp = this.activeTheme.properties.find(prop => prop.name === property.name);
            if (filteredProp) {
                const index = this.activeTheme.properties.indexOf(filteredProp);
                this.activeTheme.properties[index] = property;
            }
        }
    }

    setColorsToWindow(property) {
        if (this.isOnWeb()) {
            Object.keys(property).forEach(key => {
                if (key !== 'name') {
                    this.setKeyValueProperty(`--${property.name}-${key}`, property[key]);
                }
            });
        }
    }

    convertToPalette(colors) {
        let palette = {};
        let scale = 50;
        for (const color of colors) {
            if (scale <= 900) {
                palette = { ...palette, [scale]: color };
                scale = scale === 50 ? 100 : scale + 100;
            }
        }
        return palette;
    }

    createPropertie(propertieName, scale, palette) {
        let propertie = { name: propertieName, default: palette[scale] };
        const keys = Object.keys(palette);
        for (const key of keys) {
            if (Number(key)) {
                propertie = { ...propertie, [key]: palette[key] };
            }
        }
        return propertie;
    }

    getDefaultScale(color, palette) {
        const keys = Object.keys(palette);
        let scale = '400';
        for (const key of keys) {
            if (palette[key] === color) {
                scale = key;
                break;
            }
        }
        return scale;
    }

    buildZoom(config) {
        if (config) {
            const zoomValue = config.zoom ? config.zoom.defaultZoom : 1;
            this.maxZoomSize = config.zoom && config.zoom.maxZoom ? config.zoom.maxZoom : this.maxZoomSize;
            this.minZoomSize = config.zoom && config.zoom.minZoom ? config.zoom.minZoom : this.minZoomSize;
            this.zoom = zoomValue;
            this.changeZoomHtmlVariable();
        }
    }

    changeZoomHtmlVariable() {
        if (this.isOnWeb()) {
            document.documentElement.style.setProperty('--zoom', this.zoom.toString());
        }
    }

    getIncreasedZoom() {
        return this.zoom + 0.25;
    }

    getDecreasedZoom() {
        return this.zoom - 0.25;
    }

    adjustZoomToLimits(size) {
        if (this.isBiggerThanMaxZoom(size)) {
            return this.maxZoomSize;
        } else if (this.isSmallerThanMinZoom(size)) {
            return this.minZoomSize;
        }
        return size;
    }

    isBiggerThanMaxZoom(value) {
        return value > this.maxZoomSize;
    }

    isSmallerThanMinZoom(value) {
        return value < this.minZoomSize;
    }

    buildFromCustomConfig(customThemes) {
        this.replaceOrAddTheme(customThemes);
        this.activateCustomActiveTheme(customThemes?.activeThemeName);
        this.buildZoom(customThemes);
        this.previousActiveTheme = this.activeTheme;
    }

    replaceOrAddTheme(customThemes) {
        if (customThemes?.themes && customThemes?.replaceDefaultThemes) {
            this.replaceThemes(customThemes?.themes);
        } else if (customThemes?.themes && !customThemes?.replaceDefaultThemes) {
            this.addThemes(customThemes?.themes);
        }
    }

    addThemes(customThemes) {
        if (customThemes && customThemes instanceof Array) {
            customThemes.forEach(theme => this.addTheme(theme));
        } else {
            this.addTheme(customThemes);
        }
    }

    replaceThemes(customThemes) {
        if (customThemes && customThemes instanceof Array) {
            this.availableThemes = [...customThemes];
        } else {
            this.availableThemes = [customThemes];
        }
    }

    activateCustomActiveTheme(themeName) {
        this.setDefaultThemeByName(themeName);
    }

    setDefaultThemeByName(themeName) {
        const theme = this.getThemeByName(themeName);
        if (theme) {
            this.setActiveTheme(theme);
        } else {
            this.setActiveTheme(purple);
        }
    }

    getThemeByName(name) {
        return this.getAvailableThemes().find(theme => theme.name === name);
    }

    setActiveTheme(theme) {
        if (theme !== this.activeTheme) {
            this.activeTheme = theme;
            this.addHtmlVariables();
        } else {
            console.warn('This theme is already active.');
        }
    }

    addHtmlVariables() {
        if (this.isOnWeb()) {
            this.activeTheme.properties.forEach(propertie => {
                this.setKeyValueProperty(`--${propertie.name}-default`, propertie.default);
                Object.keys(propertie).forEach(key => {
                    if (key !== 'name' && key !== 'default') {
                        this.setKeyValueProperty(`--${propertie.name}-${key}`, propertie[key]);
                    }
                });
            });
        }
    }

    setKeyValueProperty(property, value) {
        document.documentElement.style.setProperty(property, value);
    }

    isOnWeb() {
        return typeof document !== 'undefined';
    }
}

export default ThemeService;
