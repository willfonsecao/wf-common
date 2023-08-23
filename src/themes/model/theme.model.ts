import { Property } from './property.model';
export interface Theme {
    name: string;
    properties: Partial<Property>[];
}
