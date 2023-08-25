const Theme = require('./theme.model');
const Zoom = require('./zoom.model');

export default ThemesConfigurations = {
    replaceDefaultThemes: boolean,
    themes: [Theme | Theme],
    activeThemeName: string,
    zoom: Zoom
};
