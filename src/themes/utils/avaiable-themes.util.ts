import { cranberry } from '../themes-files/cranberry.theme';
import { dark } from '../themes-files/dark.theme';
import { green } from '../themes-files/green.theme';
import { purple } from '../themes-files/purple.theme';
import { Theme } from '../model/theme.model';
import { navy } from '../themes-files/navy.theme';
import { orange } from '../themes-files/orange.theme';
import { ruby } from '../themes-files/ruby.theme';
import { turquoise } from '../themes-files/turquoise.theme';

export class AvaiableThemesUtil {
    static getAvaiableThemes(): Theme[] {
        return [cranberry, dark, green, navy, orange, ruby, purple, turquoise];
    }
}
