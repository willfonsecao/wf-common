import { generateAccentPalette } from 'materialifier';

import { Property } from "../model/property.model";
import { Theme } from "../model/theme.model";
import { ThemesConfigurations } from "../model/themes.configurations";
import { darkMode } from "../themes-files/dark-mode.theme";
import { AvaiableThemesUtil } from "../utils/avaiable-themes.util";
import { purple } from '../themes-files/purple.theme';

export class ThemeService {
    private activeTheme!: Theme;
    private zoom = 1;
    private maxZoomSize = 99999999;
    private minZoomSize = -99999999;
    private previousActiveTheme!: Theme;
    private availableThemes: Theme[] = AvaiableThemesUtil.getAvaiableThemes();
    private isDarkModeEnabled = false;

    constructor(config: ThemesConfigurations) {
        this.buildFromCustomConfig(config);
    }

    addTheme(theme: Theme): void {
        this.availableThemes.push(theme);
    }

    getAvailableThemes(): Theme[] {
        return this.availableThemes;
    }

    getActiveTheme(): Theme {
        return this.activeTheme;
    }

    getPropertyScale(themeName: string, propertyName: string): Partial<Property> | undefined {
        return this.getThemeByName(themeName)?.properties.find(prop => prop.name === propertyName);
    }

    getActiveThemeColorScale(variableName: string, scale: string): string | undefined {
        return this.getColor(this.activeTheme.name, variableName, scale);
    }

    getColor(themeName: string, variableName: string, scale: string): string | undefined {
        const theme: Theme | undefined = this.availableThemes.find((th) => th.name === themeName);
        if (theme) {
            const property: Partial<Property> | undefined = theme.properties.find((pro) => pro.name === variableName);
            if (property) {
                return (property as any)[scale];
            }
            console.error(`Cannot find any variable called ${variableName} in the ${themeName} theme`);
            return undefined;
        }
        console.error(`Cannot find any theme called ${themeName}`);
        return undefined;
    }

    toggleDarkMode(): void {
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

    activateTheme(themeName: string): void {
        const theme: Theme | undefined = this.availableThemes.find((t) => t.name === themeName);
        if (theme) {
            this.previousActiveTheme = this.activeTheme;
            this.setActiveTheme(theme);
        } else {
            console.error(`There isn't any ${themeName} theme in available themes`);
        }
    }

    increaseZoom(): void {
        const value = this.getIncreasedZoom();
        this.zoom = this.adjustZoomToLimits(value);
        this.changeZoomHtmlVariable();
    }

    decreaseZoom(): void {
        const value = this.getDecreasedZoom();
        this.zoom = this.adjustZoomToLimits(value);
        this.changeZoomHtmlVariable();
    }

    resetZoom(): void {
        this.zoom = 0;
        this.changeZoomHtmlVariable();
    }

    generateScale(color: string, propertyName: string, replaceOnActiveTheme: boolean = false): void {
        const colors = generateAccentPalette(color.toLocaleLowerCase());
        const palette = this.convertToPalette(colors);
        const defaultScale = this.getDefaultScale(color.toLocaleLowerCase(), palette);
        const property = this.createPropertie(propertyName, defaultScale, palette);
        this.setColorsToWindow(property);
        this.replacePropertyOnActiveTheme(property, replaceOnActiveTheme);
    }

    private addPrimaryColorOnDarkMode(): void {
        const primary = this.getPropertyScale(this.previousActiveTheme.name, 'primary');
        if (primary) {
            darkMode.properties.push(primary);
        }
    }

    private replacePropertyOnActiveTheme(property: Property, replaceOnActiveTheme: boolean): void {
        if (replaceOnActiveTheme) {
            const filteredProp = this.activeTheme.properties.find((prop) => prop.name === property.name);
            if (filteredProp) {
                const index = this.activeTheme.properties.indexOf(filteredProp);
                this.activeTheme.properties[index] = property;
            }
        }
    }

    private setColorsToWindow(propertie: any): void {
        if (this.isOnWeb()) {
            Object.keys(propertie).forEach((key) => {
                if (key !== 'name') {
                    this.setKeyValueProperty(`--${propertie.name}-${key}`, propertie[key]);
                }
            });
        }
    }

    private convertToPalette(colors: string[]): any {
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

    private createPropertie(propertieName: string, scale: string, palette: any): any {
        let propertie: any = { name: propertieName, default: palette[scale] };
        const keys: string[] = Object.keys(palette);
        for (const key of keys) {
            if (Number(key)) {
                propertie = { ...propertie, [key]: palette[key] };
            }
        }
        return propertie;
    }

    private getDefaultScale(color: string, palette: any): string {
        const keys: string[] = Object.keys(palette);
        let scale = '400';
        for (const key of keys) {
            if (palette[key] === color) {
                scale = key;
                break;
            }
        }
        return scale;
    }

    private buildZoom(config: ThemesConfigurations): void {
        const zoomValue = config.zoom ? config.zoom.defaultZoom : 1;
        this.maxZoomSize = config.zoom && config.zoom.maxZoom ? config.zoom.maxZoom : this.maxZoomSize;
        this.minZoomSize = config.zoom && config.zoom.minZoom ? config.zoom.minZoom : this.minZoomSize;
        this.zoom = zoomValue;
        this.changeZoomHtmlVariable();
    }

    private changeZoomHtmlVariable(): void {
        if (this.isOnWeb()) {
            document.documentElement.style.setProperty('--zoom', this.zoom.toString());
        }
    }

    private getIncreasedZoom(): number {
        return this.zoom + 0.25;
    }

    private getDecreasedZoom(): number {
        return this.zoom - 0.25;
    }

    private adjustZoomToLimits(size: number): number {
        if (this.isBiggerThanMaxZoom(size)) {
            return this.maxZoomSize;
        } else if (this.isSmallerThanMinZoom(size)) {
            return this.minZoomSize;
        }
        return size;
    }

    private isBiggerThanMaxZoom(value: number): boolean {
        return value > this.maxZoomSize;
    }

    private isSmallerThanMinZoom(value: number): boolean {
        return value < this.minZoomSize;
    }

    private buildFromCustomConfig(customThemes: ThemesConfigurations): void {
        this.replaceOrAddTheme(customThemes);
        this.activateCustomActiveTheme(customThemes.activeThemeName);
        this.buildZoom(customThemes);
        this.previousActiveTheme = this.activeTheme;
    }

    private replaceOrAddTheme(customThemes: ThemesConfigurations): void {
        if (customThemes.themes && customThemes.replaceDefaultThemes) {
            this.replaceThemes(customThemes.themes);
        } else if (customThemes.themes && !customThemes.replaceDefaultThemes) {
            this.addThemes(customThemes.themes);
        }
    }

    private addThemes(customThemes: Theme | Theme[]): void {
        if (customThemes && customThemes instanceof Array) {
            customThemes.forEach(theme => this.addTheme(theme));
        } else {
            this.addTheme(customThemes as Theme);
        }
    }

    private replaceThemes(customThemes: Theme | Theme[]): void {
        if (customThemes && customThemes instanceof Array) {
            this.availableThemes = [...customThemes];
        } else {
            this.availableThemes = [customThemes as Theme];
        }
    }

    private activateCustomActiveTheme(themeName: string | undefined): void {
        if (themeName) {
            this.setDefaultThemeByName(themeName);
        }
    }

    private setDefaultThemeByName(themeName: string): void {
        const theme = this.getThemeByName(themeName);
        if (theme) {
            this.setActiveTheme(theme);
        } else {
            this.setActiveTheme(purple);
        }
    }

    private getThemeByName(name: string): Theme | undefined {
        return this.getAvailableThemes().find((theme: Theme) => theme.name === name);
    }

    private setActiveTheme(theme: Theme): void {
        if (theme !== this.activeTheme) {
            this.activeTheme = theme;
            this.addHtmlVariables();
        } else {
            console.warn('This theme is already active.');
        }
    }

    private addHtmlVariables(): void {
        if (this.isOnWeb()) {
            this.activeTheme.properties.forEach((propertie: any) => {
                this.setKeyValueProperty(`--${propertie.name}-default`, propertie.default);
                Object.keys(propertie).forEach((key) => {
                    if (key !== 'name' && key !== 'default') {
                        this.setKeyValueProperty(`--${propertie.name}-${key}`, propertie[key]);
                    }
                });
            });
        }
    }

    private setKeyValueProperty(property: any, value: any): void {
        document.documentElement.style.setProperty(property, value);
    }

    private isOnWeb(): boolean {
        return typeof document !== 'undefined';
    }
}