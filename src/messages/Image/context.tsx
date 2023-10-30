import { createContext } from 'react';
import { IMessageImage } from '../types';

export interface IMessangerImageContext extends IMessageImage {
    onExpand: () => void,
    onClose: () => void,
}

export const MessangerImageContext = createContext<IMessangerImageContext | null>(null);