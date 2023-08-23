import { Theme } from './theme.model';
import { Zoom } from './zoom.model';

export interface ThemesConfigurations {
    replaceDefaultThemes?: boolean;
    themes?: Theme | Theme[];
    activeThemeName?: string;
    zoom?: Zoom;
}
